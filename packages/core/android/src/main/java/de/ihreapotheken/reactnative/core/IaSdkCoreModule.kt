package de.ihreapotheken.reactnative.core

import android.app.Activity
import android.content.Intent
import android.util.Log
import androidx.compose.ui.graphics.Color
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.sdk.apofinder.ApofinderModule
import de.ihreapotheken.sdk.appointments.AppointmentsModule
import de.ihreapotheken.sdk.core.SdkModule
import de.ihreapotheken.sdk.core.api.SdkFeatureProvider
import de.ihreapotheken.sdk.core.api.listener.SdkEventListener
import de.ihreapotheken.sdk.core.domain.model.EnvironmentType
import de.ihreapotheken.sdk.core.domain.model.sdk.SdkEvent
import de.ihreapotheken.sdk.core.domain.session.PrerequisiteFlowConfiguration
import de.ihreapotheken.sdk.core.ui.theme.IAHeaderConfiguration
import de.ihreapotheken.sdk.core.ui.theme.IAHeaderStyle
import de.ihreapotheken.sdk.core.ui.theme.IAPrimaryButtonConfiguration
import de.ihreapotheken.sdk.core.ui.theme.IASecondaryButtonConfiguration
import de.ihreapotheken.sdk.core.ui.theme.IAUIConfiguration
import de.ihreapotheken.sdk.debugviewer.DebugViewerModule
import de.ihreapotheken.sdk.integrations.api.IaSdk
import de.ihreapotheken.sdk.integrations.api.IaSdkConfiguration
import de.ihreapotheken.sdk.integrations.api.IaUserAddress
import de.ihreapotheken.sdk.integrations.api.IaUserData
import de.ihreapotheken.sdk.integrations.api.InitState
import de.ihreapotheken.sdk.integrations.api.MockBundlePermissionsSettings
import de.ihreapotheken.sdk.integrations.api.MockForceUpdateSettings
import de.ihreapotheken.sdk.integrations.api.MockSdkFeaturesSettings
import de.ihreapotheken.sdk.integrations.api.QaConfiguration
import de.ihreapotheken.sdk.integrations.api.analytics.ExperimentalIaAnalyticsApi
import de.ihreapotheken.sdk.integrations.api.analytics.IaAnalyticsConsentStatus
import de.ihreapotheken.sdk.integrations.api.view.IaPrerequisiteActivity
import de.ihreapotheken.sdk.integrations.api.view.IaSdkActivity
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicBoolean

@OptIn(ExperimentalIaAnalyticsApi::class)
@ReactModule(name = IaSdkCoreModule.NAME)
class IaSdkCoreModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkCoreSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkCore"
    private const val TAG = "IaSdkCoreModule"
    const val REQUEST_CODE_PREREQUISITES = 7301

    // Track registered modules for dynamic registration
    private val registeredModuleTypes = mutableListOf<SdkModule>()

    /**
     * Register a module type to be included during SDK initialization.
     * Called by feature modules during their registration.
     */
    @JvmStatic
    fun registerModuleType(moduleType: SdkModule) {
      synchronized(registeredModuleTypes) {
        if (!registeredModuleTypes.contains(moduleType)) {
          registeredModuleTypes.add(moduleType)
        }
      }
    }
  }

  /**
   * Scope for the SDK calls. They run on the main thread, like the SDK's own
   * callers, and not on the native modules thread React Native calls on.
   */
  private val scope = MainScope()

  /** The call of a running prerequisites flow, answered by its activity result. */
  private var prerequisiteFlowPromise: Promise? = null

  private val activityEventListener = object : ActivityEventListener {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_CODE_PREREQUISITES) return
      prerequisiteFlowPromise?.resolve(
        Arguments.createMap().apply { putBoolean("isCancelled", resultCode != Activity.RESULT_OK) }
      )
      prerequisiteFlowPromise = null
    }

    override fun onNewIntent(intent: Intent) = Unit
  }

  init {
    IaSdkRuntime.attach(reactContext)
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = NAME

  override fun invalidate() {
    reactApplicationContext.removeActivityEventListener(activityEventListener)
    prerequisiteFlowPromise?.reject("NO_ACTIVITY", "The app closed before the prerequisites flow finished.")
    prerequisiteFlowPromise = null
    scope.cancel()
    super.invalidate()
  }

  /**
   * Runs [block] on the main thread and settles [promise] with its result, or
   * with an error code naming [method] when it throws.
   */
  private fun runSdkCall(method: String, promise: Promise, block: suspend () -> Any?) {
    scope.launch {
      try {
        promise.resolve(block())
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        Log.w(TAG, "$method failed", e)
        promise.rejectMethod(method, e.message, e)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Event plumbing
  // ---------------------------------------------------------------------------

  override fun addListener(eventName: String) = Unit

  override fun removeListeners(count: Double) = Unit

  override fun setRequestHandlerEnabled(type: String, enabled: Boolean) {
    IaSdkRuntime.setRequestHandlerEnabled(type, enabled)
  }

  override fun respondToRequest(requestId: String, response: ReadableMap?) {
    IaSdkRuntime.respond(requestId, response?.toHashMap())
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  override fun initialize(config: ReadableMap, promise: Promise) {
    val accessKey = config.getStringOrNull("accessKey")
    val clientId = config.getStringOrNull("clientId")
    if (accessKey.isNullOrBlank() || clientId.isNullOrBlank()) {
      promise.reject("ARG_ERROR", "accessKey and clientId must not be empty.")
      return
    }
    val serverEnvironment = when (config.getStringOrNull("serverEnvironment")) {
      "development" -> EnvironmentType.DEV
      "production" -> EnvironmentType.PROD
      else -> EnvironmentType.STAGING
    }
    val initialization = config.getMapOrNull("initialization")
    val prerequisites = initialization?.getMapOrNull("prerequisites")
    val footer = config.getMapOrNull("footer")
    val qaConfiguration = try {
      config.getMapOrNull("qaConfiguration")?.let(::parseQaConfiguration)
    } catch (e: IllegalArgumentException) {
      promise.reject("ARG_ERROR", e.message)
      return
    }
    val uiConfiguration = parseUIConfiguration(config.getMapOrNull("uiConfiguration"))

    scope.launch {
      val modulesToRegister = synchronized(registeredModuleTypes) { registeredModuleTypes.toMutableList() }
      // Apofinder (pharmacy selection) and appointment booking are mandatory,
      // always-on features owned by the core module.
      for (mandatory in listOf(ApofinderModule, AppointmentsModule)) {
        if (!modulesToRegister.contains(mandatory)) modulesToRegister.add(mandatory)
      }
      IaSdk.register(*modulesToRegister.toTypedArray())

      qaConfiguration?.let { IaSdk.setQaConfiguration(it) }
      // A set imprint listener replaces the SDK's own imprint page, so it's
      // only set when the host handles it.
      if (footer?.getBooleanOrNull("isImprintHandledByHostApp") == true) {
        IaSdk.setImpressumClickListener(IaSdkCallbacks)
      }
      IaSdk.setAnalyticsListener(IaSdkCallbacks)

      // The listener keeps receiving SDK events after initialization, but a
      // promise settles only once.
      val hasReplied = AtomicBoolean(false)
      fun succeed() {
        attachSdkListeners()
        if (!hasReplied.getAndSet(true)) promise.resolve(null)
      }
      fun fail(message: String?) {
        if (!hasReplied.getAndSet(true)) promise.reject("INIT_ERROR", message ?: "Initialization failed.")
      }

      try {
        IaSdk.init(
          context = reactApplicationContext.applicationContext,
          apiKey = accessKey,
          clientId = clientId,
          configuration = IaSdkConfiguration(
            shouldFetchThemeFromRemote = config.getBooleanOrNull("shouldFetchThemeFromRemote") ?: false,
            prerequisiteFlowConfiguration = PrerequisiteFlowConfiguration(
              shouldRunLegal = prerequisites?.getBooleanOrNull("runLegalIfNeeded") ?: true,
              shouldRunOnboarding = prerequisites?.getBooleanOrNull("runOnboardingIfNeeded") ?: false,
            ).apply {
              setSkipApofinderInPrerequisites(prerequisites?.getBooleanOrNull("runApofinderIfNeeded") == false)
            },
            channelId = config.getDoubleOrNull("channelId")?.toInt(),
            shouldShowIndicator = initialization?.getBooleanOrNull("shouldShowIndicator") ?: false,
            uiConfiguration = uiConfiguration,
            isPickupLockerAndCourierShippingEnabled =
              config.getBooleanOrNull("isPickupLockerAndCourierShippingEnabled") ?: false,
            analyticsEnabled = config.getBooleanOrNull("isAnalyticsEnabled") ?: IaSdkConfiguration().analyticsEnabled,
            hapticFeedbackEnabled = config.getBooleanOrNull("isHapticFeedbackEnabled") ?: true,
            playStoreId = config.getStringOrNull("playStoreId"),
            isSaveCardEnabled = config.getMapOrNull("cardLink")?.getBooleanOrNull("isSaveCardEnabled") ?: false,
          ),
          environmentType = serverEnvironment,
          sdkEventListener = object : SdkEventListener {
            override fun onSdkEvent(event: SdkEvent) {
              when (event) {
                is SdkEvent.InitStatus.InitializationCompleted -> succeed()
                is SdkEvent.InitStatus.AlreadyInitialized -> {
                  // Sent whenever the SDK isn't uninitialized: it may still be
                  // initializing, have failed, or outlive a JS reload.
                  scope.launch {
                    val state = IaSdk.initState.first { it == InitState.INITIALIZED || it == InitState.ERROR }
                    if (state == InitState.INITIALIZED) {
                      succeed()
                    } else {
                      fail("An earlier initialization failed, and the Android SDK doesn't initialize again.")
                    }
                  }
                }
                is SdkEvent.InitError -> fail(event.message)
                else -> Unit
              }
            }
          },
        )
      } catch (e: Exception) {
        fail(e.message)
      }
    }
  }

  /**
   * Attaches the listeners to the initialized SDK. A module that isn't
   * registered has no listener to attach.
   */
  private fun attachSdkListeners() {
    runCatching {
      IaSdk.ordering.setCartListener(IaSdkCallbacks)
      IaSdk.ordering.setCheckoutListener(IaSdkCallbacks)
    }.onFailure { Log.d(TAG, "Ordering listeners not attached: ${it.message}") }
    runCatching {
      IaSdk.rx.setRedeemPrescriptionListener(IaSdkCallbacks)
    }.onFailure { Log.d(TAG, "Prescription listener not attached: ${it.message}") }
  }

  // ---------------------------------------------------------------------------
  // User data
  // ---------------------------------------------------------------------------

  override fun logout(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("logout", promise) {
      if (!IaSdk.clearAllData()) throw IllegalStateException("Failed to logout.")
      // Unlike the iOS SDK's, the Android SDK's clearAllData keeps the cart.
      runCatching { IaSdk.ordering.deleteCart() }
      IaSdkCallbacks.reportEmptyCart()
      null
    }
  }

  override fun setGuestUserData(data: ReadableMap, promise: Promise) {
    val firstName = data.getStringOrNull("firstName")
    val lastName = data.getStringOrNull("lastName")
    val email = data.getStringOrNull("email")
    if (firstName == null || lastName == null || email == null) {
      promise.reject("ARG_ERROR", "Missing or invalid firstName, lastName or email.")
      return
    }
    val countryCode = data.getStringOrNull("phoneNumberCountryCode")
    val userData = IaUserData(
      salutation = normalizedSalutation(data.getStringOrNull("salutation") ?: ""),
      firstName = firstName,
      lastName = lastName,
      email = email,
      countryCode = countryCode?.let { it.trim().removePrefix("+").toIntOrNull() ?: 49 },
      phoneNumberWithoutCountryCode = data.getStringOrNull("phoneNumberWithoutCountryCode"),
    )
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("setGuestUserData", promise) {
      IaSdk.setUserData(userData)
      null
    }
  }

  override fun setUserBillingAddress(address: ReadableMap, promise: Promise) {
    setUserAddress("setUserBillingAddress", address, promise) { IaSdk.setUserBillingAddress(it) }
  }

  override fun setUserDeliveryAddress(address: ReadableMap, promise: Promise) {
    setUserAddress("setUserDeliveryAddress", address, promise) { IaSdk.setUserDeliveryAddress(it) }
  }

  private fun setUserAddress(method: String, map: ReadableMap, promise: Promise, apply: (IaUserAddress) -> Unit) {
    val address = parseUserAddress(map)
    if (address == null) {
      promise.reject(
        "ARG_ERROR",
        "Missing or invalid argument types. Expected String values for firstName, lastName, street, houseNumber, zipCode and city.",
      )
      return
    }
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall(method, promise) {
      apply(address)
      null
    }
  }

  override fun clearUserBillingAddress(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("clearUserBillingAddress", promise) {
      IaSdk.setUserBillingAddress(null)
      null
    }
  }

  override fun clearUserDeliveryAddress(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("clearUserDeliveryAddress", promise) {
      IaSdk.setUserDeliveryAddress(null)
      null
    }
  }

  // ---------------------------------------------------------------------------
  // Screens
  // ---------------------------------------------------------------------------

  override fun launchScreen(screen: String, options: ReadableMap?, promise: Promise) {
    if (screen == "prescriptionScanner" || screen == "ePrescriptionScanner") {
      promise.reject("NOT_SUPPORTED", "The Android SDK has no scanner screen; open it from the redeem prescription screen.")
      return
    }
    runSdkCall("launchScreen", promise) {
      if (!IaSdkRuntime.startSdkScreen(screen)) {
        throw IllegalArgumentException("Unknown screen: $screen")
      }
      null
    }
  }

  override fun finishAllActivities(promise: Promise) {
    runSdkCall("finishAllActivities", promise) {
      // SDK screens ask the back handler before closing, which this skips.
      IaSdkRuntime.skipBackActionWhileFinishingAll()
      IaSdkActivity.finishAllActivities()
      // The prerequisites activity and the transfer overlay aren't among the
      // SDK's tracked screens.
      IaSdkRuntime.currentActivity()?.finishActivity(REQUEST_CODE_PREREQUISITES)
      IaSdkRuntime.finishOpenSdkScreens()
      null
    }
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  override fun transferSDKv1UserData(promise: Promise) {
    runSdkCall("transferSDKv1UserData", promise) {
      IaSdk.transferSDKv1UserData(reactApplicationContext.applicationContext)
      null
    }
  }

  override fun isInitialized(promise: Promise) {
    promise.resolve(IaSdk.isInitialized())
  }

  override fun getInitializationState(promise: Promise) {
    promise.resolve(IaSdkRuntime.initStateName(IaSdk.initState.value))
  }

  override fun getEnvironment(promise: Promise) {
    promise.resolve(
      when (EnvironmentType.current()) {
        EnvironmentType.DEV -> "development"
        EnvironmentType.STAGING -> "staging"
        EnvironmentType.PROD -> "production"
      }
    )
  }

  // ---------------------------------------------------------------------------
  // Prerequisites
  // ---------------------------------------------------------------------------

  override fun resetPrerequisites(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("resetPrerequisites", promise) {
      if (!IaSdk.resetPrerequisites()) throw IllegalStateException("Failed to reset prerequisites.")
      null
    }
  }

  override fun resetAnalyticsConsent(promise: Promise) {
    // Clearing the answer makes the legal screen ask again, as iOS's
    // resetAnalyticsConsent does. Before initialization the SDK ignores it.
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("resetAnalyticsConsent", promise) {
      IaSdk.setAnalyticsConsentStatus(IaAnalyticsConsentStatus.NOT_ANSWERED)
      null
    }
  }

  override fun isPrerequisiteFlowCompleted(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("isPrerequisiteFlowCompleted", promise) {
      IaSdk.isPrerequisiteFlowCompleted()
    }
  }

  override fun launchPrerequisiteFlow(promise: Promise) {
    // Before initialization the prerequisites activity would show an empty
    // screen until closed.
    if (!IaSdkRuntime.requireInitialized(promise)) return
    if (prerequisiteFlowPromise != null) {
      promise.reject("PREREQUISITE_FLOW_IN_PROGRESS", "The prerequisites flow is already running.")
      return
    }
    scope.launch {
      try {
        // With completed prerequisites the activity would only open and close again.
        if (IaSdk.isPrerequisiteFlowCompleted()) {
          promise.resolve(Arguments.createMap().apply { putBoolean("isCancelled", false) })
          return@launch
        }
        val activity = IaSdkRuntime.currentActivity()
        if (activity == null) {
          promise.reject("NO_ACTIVITY", "Launching the prerequisites flow needs an activity.")
          return@launch
        }
        prerequisiteFlowPromise = promise
        activity.startActivityForResult(
          IaPrerequisiteActivity.createIntent(activity),
          REQUEST_CODE_PREREQUISITES,
        )
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        prerequisiteFlowPromise = null
        promise.rejectMethod("launchPrerequisiteFlow", e.message, e)
      }
    }
  }

  override fun legacySetupAsCoreApp(promise: Promise) {
    // Only the iOS SDK needs a setup for the Core app.
    promise.resolve(null)
  }

  // ---------------------------------------------------------------------------
  // Debugging
  // ---------------------------------------------------------------------------

  override fun presentLogs(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("presentLogs", promise) {
      val provider = SdkFeatureProvider.debugViewerFeatureProvider
        ?: throw IllegalStateException("The SDK log viewer isn't available.")
      provider.openDebugViewer(IaSdkRuntime.currentActivity() ?: reactApplicationContext.applicationContext)
      null
    }
  }

  override fun exportLogs(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("exportLogs", promise) {
      // The SDK writes a file even without logs, and returns null only when
      // exporting failed.
      withContext(Dispatchers.IO) {
        DebugViewerModule.exportLogs(reactApplicationContext.applicationContext)?.absolutePath
      } ?: throw IllegalStateException("The SDK couldn't export its logs.")
    }
  }

  override fun setHapticFeedbackEnabled(enabled: Boolean, promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    runSdkCall("setHapticFeedbackEnabled", promise) {
      IaSdk.setHapticFeedbackEnabled(enabled)
      null
    }
  }

  // ---------------------------------------------------------------------------
  // Parsing
  // ---------------------------------------------------------------------------

  /**
   * Maps the case-insensitive salutation values to the labels the AppSDK
   * lists in its salutation picker. Unknown values are stored as
   * "Keine Angabe", as on iOS.
   */
  private fun normalizedSalutation(salutation: String): String =
    when (salutation.trim().lowercase()) {
      "herr" -> "Herr"
      "frau" -> "Frau"
      "divers", "diverse" -> "Divers"
      else -> "Keine Angabe"
    }

  private fun parseUserAddress(map: ReadableMap): IaUserAddress? {
    val firstName = map.getStringOrNull("firstName") ?: return null
    val lastName = map.getStringOrNull("lastName") ?: return null
    val street = map.getStringOrNull("street") ?: return null
    val houseNumber = map.getStringOrNull("houseNumber") ?: return null
    val zipCode = map.getStringOrNull("zipCode") ?: return null
    val city = map.getStringOrNull("city") ?: return null
    val countryCode = map.getDoubleOrNull("phoneNumberCountryCode")?.toInt()
    val phoneNumber = map.getStringOrNull("phoneNumberWithoutCountryCode")?.takeIf { countryCode != null }
    return IaUserAddress(
      salutation = map.getStringOrNull("salutation")?.let(::normalizedSalutation) ?: "",
      firstName = firstName,
      lastName = lastName,
      street = street,
      houseNumber = houseNumber,
      zipCode = zipCode,
      city = city,
      phoneNumber = phoneNumber,
      countryCode = if (phoneNumber != null) countryCode else null,
      // The AppSDK labels this field "Firma, c/o, Gebäude oder
      // Zusatzinformation", the counterpart of iOS's `additionalInfo`.
      company = map.getStringOrNull("additionalInfo"),
    )
  }

  private fun parseQaConfiguration(map: ReadableMap): QaConfiguration {
    val mockSdkFeatures = map.getMapOrNull("mockSdkFeatures")
    val mockBundlePermissions = map.getMapOrNull("mockBundlePermissions")
    val mockForceUpdate = map.getMapOrNull("mockForceUpdate")
    val customPharmacyId = map.getStringOrNull("apofinderCustomPharmacyId")?.let {
      it.trim().toIntOrNull()
        ?: throw IllegalArgumentException("apofinderCustomPharmacyId must be a numeric pharmacy ID, got \"$it\".")
    }
    return QaConfiguration(
      mockSdkFeaturesSettings = mockSdkFeatures?.let {
        MockSdkFeaturesSettings(
          mockEnabled = true,
          isExpressDeliveryEnabled = it.getBooleanOrNull("isExpressDeliveryEnabled") != false,
          isOnlinePaymentEnabled = it.getBooleanOrNull("isOnlinePaymentEnabled") != false,
          isTrackingEnabled = it.getBooleanOrNull("isTrackingEnabled") == true,
          isCardLinkEnabled = it.getBooleanOrNull("isCardLinkEnabled") != false,
        )
      },
      mockBundlePermissionsSettings = mockBundlePermissions?.let {
        MockBundlePermissionsSettings(
          mockEnabled = true,
          enableOtc = it.getBooleanOrNull("isOverTheCounterEnabled") != false,
          enableOrdering = it.getBooleanOrNull("isOrderingEnabled") != false,
          enablePharmacy = it.getBooleanOrNull("isPharmacyEnabled") != false,
          enableRx = it.getBooleanOrNull("isPrescriptionEnabled") != false,
          enableCardlink = it.getBooleanOrNull("isCardLinkEnabled") != false,
        )
      },
      mockForceUpdateSettings = mockForceUpdate?.let {
        val defaults = MockForceUpdateSettings()
        MockForceUpdateSettings(
          mockEnabled = true,
          type = if (it.getBooleanOrNull("isHardUpdate") == true) "HARD" else "SOFT",
          minimumVersion = it.getStringOrNull("minimumVersion") ?: defaults.minimumVersion,
          message = it.getStringOrNull("message") ?: defaults.message,
          playStoreId = it.getStringOrNull("playStoreId"),
        )
      },
      showTestPharmaciesInApofinder = map.getBooleanOrNull("showTestPharmaciesInApofinder") == true,
      maxScrollSpeed = map.getDoubleOrNull("maxScrollSpeed")?.toFloat(),
      apofinderCustomPharmacyId = customPharmacyId,
    )
  }

  /**
   * JS sends colors as ARGB numbers. `Color(Long)` is Compose's ARGB factory,
   * unlike the `Color(ULong)` constructor, which expects a packed value.
   */
  private fun ReadableMap.getColorOrNull(key: String): Color? =
    getDoubleOrNull(key)?.toLong()?.let { Color(it) }

  private fun parseUIConfiguration(map: ReadableMap?): IAUIConfiguration {
    if (map == null) return IAUIConfiguration()
    val header = map.getMapOrNull("header")
    val primary = map.getMapOrNull("primaryButton")
    val secondary = map.getMapOrNull("secondaryButton")
    return IAUIConfiguration(
      header = header?.let {
        IAHeaderConfiguration(
          style = if (it.getStringOrNull("style") == "monotone") IAHeaderStyle.MONOTONE else IAHeaderStyle.DUOTONE,
          primaryColor = it.getColorOrNull("primaryColor"),
          secondaryColor = it.getColorOrNull("secondaryColor"),
        )
      } ?: IAHeaderConfiguration(),
      primaryButton = primary?.let {
        IAPrimaryButtonConfiguration(
          backgroundColor = it.getColorOrNull("backgroundColor"),
          backgroundDisabledColor = it.getColorOrNull("backgroundDisabledColor"),
          textColor = it.getColorOrNull("textColor"),
          textDisabledColor = it.getColorOrNull("textDisabledColor"),
          borderColor = it.getColorOrNull("borderColor"),
          borderDisabledColor = it.getColorOrNull("borderDisabledColor"),
          borderWidth = it.getDoubleOrNull("borderWidth")?.toFloat(),
          borderRadius = it.getDoubleOrNull("borderRadius")?.toFloat(),
        )
      } ?: IAPrimaryButtonConfiguration(),
      secondaryButton = secondary?.let {
        IASecondaryButtonConfiguration(
          backgroundColor = it.getColorOrNull("backgroundColor"),
          backgroundDisabledColor = it.getColorOrNull("backgroundDisabledColor"),
          textColor = it.getColorOrNull("textColor"),
          textDisabledColor = it.getColorOrNull("textDisabledColor"),
          borderColor = it.getColorOrNull("borderColor"),
          borderDisabledColor = it.getColorOrNull("borderDisabledColor"),
          borderWidth = it.getDoubleOrNull("borderWidth")?.toFloat(),
          borderRadius = it.getDoubleOrNull("borderRadius")?.toFloat(),
        )
      } ?: IASecondaryButtonConfiguration(),
      // Absent keeps the SDK default (mascot shown).
      shouldShowMascotIllustrations = map.getBooleanOrNull("shouldShowMascotIllustrations") ?: true,
    )
  }
}
