package de.ihreapotheken.reactnative.cardlink

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.reactnative.core.IaSdkCoreModule
import de.ihreapotheken.reactnative.core.getBooleanOrNull
import de.ihreapotheken.reactnative.core.getDoubleOrNull
import de.ihreapotheken.reactnative.core.getStringOrNull
import de.ihreapotheken.reactnative.core.toStringList
import de.ihreapotheken.sdk.cardlink.BuildConfig
import de.ihreapotheken.sdk.cardlink.CardLinkListener
import de.ihreapotheken.sdk.cardlink.CardLinkSdkEnvironment
import de.ihreapotheken.sdk.cardlink.CardLinkSdkEnvironmentType
import de.ihreapotheken.sdk.cardlink.CardlinkModule
import de.ihreapotheken.sdk.cardlink.ConsentStatus
import de.ihreapotheken.sdk.cardlink.HostAppLogProvider
import de.ihreapotheken.sdk.cardlink.api.CardLink
import de.ihreapotheken.sdk.cardlink.api.CardLinkConfig
import de.ihreapotheken.sdk.cardlink.api.CardLinkIllustrationColor
import de.ihreapotheken.sdk.cardlink.api.REQUEST_CODE_CARD_LINK_ACTIVITY
import de.ihreapotheken.sdk.cardlink.domain.model.CardLinkSession
import de.ihreapotheken.sdk.cardlink.domain.model.insurancecard.InsuranceCard
import de.ihreapotheken.sdk.core.api.featureproviders.SavedCardData
import de.ihreapotheken.sdk.core.domain.model.EnvironmentType
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

@ReactModule(name = IaSdkCardLinkModule.NAME)
class IaSdkCardLinkModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkCardLinkSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkCardLink"
    private const val TAG = "IaSdkCardLink"
    private const val GUEST_USER_ID = "guest_user_id"

    // Event names matching TypeScript constants
    private const val EVENT_CONSENT = "CARDLINK_CONSENT_EVENT"
    private const val EVENT_SESSION_CREATED = "CARDLINK_SESSION_CREATED"
    private const val EVENT_PRESCRIPTIONS_REDEEMED = "CARDLINK_PRESCRIPTIONS_REDEEMED"
    private const val EVENT_CARDLINK = "CARDLINK_EVENT"
    private const val EVENT_ANALYTICS = "CARDLINK_ANALYTICS_EVENT"

    /**
     * How long after the saved cards screen closed a CardLink screen still
     * counts as its continuation, which covers the scan flow's sign-in.
     */
    private const val SAVED_CARDS_CONTINUATION_MS = 15_000L
  }

  // Hold strong references to prevent GC while CardLink activity is open
  private var activeListener: CardLinkListener? = null
  private var activeConfig: CardLinkConfig? = null

  /** Scope for the SDK's storage calls, which block and run on IO. */
  private val scope = MainScope()

  /** The SDK's card storage isn't safe to create from two threads at once. */
  private val storageMutex = Mutex()

  private val mainHandler = Handler(Looper.getMainLooper())

  /**
   * Whether a CardLink flow launched by this module is starting or shown. The
   * SDK signs in before it opens its screen, and doesn't open it when that
   * fails. Only changed on the main thread.
   */
  private var isCardLinkSessionActive = false

  /** Whether this module launched CardLink, which sets the SDK's CardLink environment. */
  private var hasLaunchedCardLink = false

  /**
   * CardLink screens of the launched flow. The Android SDK has no exit
   * callback, so the flow has closed when the last of them finishes.
   */
  private var cardLinkActivityCount = 0

  /**
   * When the launched flow last ended on the saved cards screen. Continuing
   * from there into the scan flow, the SDK closes that screen after a fixed
   * delay, which can be before the scan flow has signed in and opened.
   */
  private var savedCardsExitTime = 0L

  private val application: Application? =
    reactContext.applicationContext as? Application

  private val activityLifecycleCallbacks = object : Application.ActivityLifecycleCallbacks {
    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
      if (!activity.isCardLinkScreen()) {
        // Continuing into the scan flow opens no other screen first, while a
        // CardLink flow the SDK starts itself is started from its screens.
        savedCardsExitTime = 0L
        return
      }
      // A scan flow that opens soon after the saved cards screen closed
      // belongs to the launched flow.
      if (!isCardLinkSessionActive && savedCardsExitTime != 0L &&
        SystemClock.elapsedRealtime() - savedCardsExitTime < SAVED_CARDS_CONTINUATION_MS
      ) {
        savedCardsExitTime = 0L
        isCardLinkSessionActive = true
      }
      if (isCardLinkSessionActive) {
        cardLinkActivityCount++
      }
    }

    override fun onActivityDestroyed(activity: Activity) {
      if (!isCardLinkSessionActive || !activity.isCardLinkScreen()) return
      cardLinkActivityCount--
      if (cardLinkActivityCount <= 0 && activity.isFinishing) {
        cardLinkActivityCount = 0
        isCardLinkSessionActive = false
        savedCardsExitTime =
          if (activity.javaClass.simpleName == "MyCardsActivity") SystemClock.elapsedRealtime() else 0L
        sendEvent(EVENT_CARDLINK, mapOf("event" to "willExitCardlink"))
      }
    }

    override fun onActivityStarted(activity: Activity) = Unit
    override fun onActivityResumed(activity: Activity) = Unit
    override fun onActivityPaused(activity: Activity) = Unit
    override fun onActivityStopped(activity: Activity) = Unit
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
  }

  private val activityEventListener = object : ActivityEventListener {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_CODE_CARD_LINK_ACTIVITY) return
      val result = when (resultCode) {
        Activity.RESULT_OK -> data?.getStringExtra("card_link_result")
        Activity.RESULT_CANCELED -> "canceled"
        else -> return
      }
      sendEvent(EVENT_CARDLINK, mapOf("event" to "cardLinkResult", "result" to result))
    }

    override fun onNewIntent(intent: Intent) = Unit
  }

  init {
    application?.registerActivityLifecycleCallbacks(activityLifecycleCallbacks)
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = NAME

  override fun invalidate() {
    application?.unregisterActivityLifecycleCallbacks(activityLifecycleCallbacks)
    reactApplicationContext.removeActivityEventListener(activityEventListener)
    scope.cancel()
    super.invalidate()
  }

  private fun Activity.isCardLinkScreen(): Boolean =
    javaClass.name.startsWith("de.ihreapotheken.sdk.cardlink.")

  private fun sendEvent(eventName: String, body: Any?) {
    val payload = if (body is Map<*, *>) {
      @Suppress("UNCHECKED_CAST")
      Arguments.makeNativeMap(body as Map<String, Any?>)
    } else {
      body
    }
    mainHandler.post {
      try {
        reactApplicationContext.emitDeviceEvent(eventName, payload)
      } catch (e: Exception) {
        Log.w(TAG, "Couldn't emit $eventName: ${e.message}")
      }
    }
  }

  override fun registerModule() {
    IaSdkCoreModule.registerModuleType(CardlinkModule)
  }

  override fun addListener(eventType: String) = Unit

  override fun removeListeners(count: Double) = Unit

  // ---------------------------------------------------------------------------
  // Launch
  // ---------------------------------------------------------------------------

  override fun launch(options: ReadableMap, promise: Promise) {
    val sdkApiKey = options.getStringOrNull("sdkApiKey")
    if (sdkApiKey.isNullOrEmpty()) {
      promise.reject("MISSING_API_KEY", "SDK API key is required")
      return
    }
    val pharmacyId = options.getStringOrNull("pharmacyId")
    if (pharmacyId.isNullOrEmpty()) {
      promise.reject("MISSING_PHARMACY_ID", "Pharmacy ID is required")
      return
    }
    val phoneNumber = options.getStringOrNull("phoneNumber")
    if (phoneNumber.isNullOrEmpty()) {
      promise.reject("MISSING_PHONE_NUMBER", "Phone number is required")
      return
    }
    val illustrationColor = CardLinkIllustrationColor.entries
      .firstOrNull { it.name == options.getStringOrNull("illustrationColor") }
      ?: CardLinkIllustrationColor.RED

    val listener = createListener(phoneNumber)
    val config = CardLinkConfig(
      sdkApiKey = sdkApiKey,
      pharmacyId = pharmacyId,
      userId = options.getStringOrNull("userId")?.ifEmpty { null } ?: GUEST_USER_ID,
      savedCardName = options.getStringOrNull("cardName"),
      canCode = options.getStringOrNull("canCode"),
      phoneNumber = phoneNumber,
      consentStatus = parseConsentStatus(options.getStringOrNull("consentStatus")),
      saveCardEnabled = options.getBooleanOrNull("saveCardEnabled") ?: true,
      primaryColor = options.getDoubleOrNull("primaryColor")?.toLong()?.toInt(),
      buttonsColor = options.getDoubleOrNull("buttonsColor")?.toLong()?.toInt(),
      textLinkColor = options.getDoubleOrNull("textLinkColor")?.toLong()?.toInt(),
      bottomNavigationColor = options.getDoubleOrNull("bottomNavigationColor")?.toLong()?.toInt(),
      cardLinkSdkEnvironment = parseEnvironment(options.getStringOrNull("environment")),
      listener = listener,
      applicationId = options.getStringOrNull("appId"),
      hostAppLogFilePath = options.getStringOrNull("coreAppLogFileURL"),
      illustrationColor = illustrationColor,
    )
    activeListener = listener
    activeConfig = config

    reactApplicationContext.runOnUiQueueThread {
      val activity = reactApplicationContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available")
        return@runOnUiQueueThread
      }
      try {
        if (options.getStringOrNull("flowType") == "launchCardLinkCards") {
          CardLink.startMyCards(activity, config)
        } else {
          CardLink.startCardLink(activity, config)
        }
        isCardLinkSessionActive = true
        hasLaunchedCardLink = true
        savedCardsExitTime = 0L
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("LAUNCH_ERROR", e.message ?: "Unknown error", e)
      }
    }
  }

  private fun createListener(phoneNumber: String) = object : CardLinkListener {
    override fun onConsentAccepted(setPhoneNumber: (String) -> Unit) {
      setPhoneNumber(phoneNumber)
      sendEvent(EVENT_CONSENT, mapOf("status" to "accepted", "phoneNumber" to null))
    }

    override fun onConsentDeclined() {
      sendEvent(EVENT_CONSENT, mapOf("status" to "declined", "phoneNumber" to null))
    }

    override fun onSessionCreated(session: CardLinkSession) {
      sendEvent(
        EVENT_SESSION_CREATED,
        mapOf(
          "cardSessionId" to session.cardSessionId,
          "sessionExpireTimestamp" to session.sessionExpireTimestamp.toDouble(),
        ),
      )
    }

    override fun onPrescriptionsRedeemed(prescriptions: String) {
      sendEvent(EVENT_PRESCRIPTIONS_REDEEMED, prescriptions)
    }

    override fun onGoToCart() {
      sendEvent(EVENT_CARDLINK, mapOf("event" to "goToCart"))
    }

    override fun openTermsAndConditions() {
      sendEvent(EVENT_CARDLINK, mapOf("event" to "openTermsAndConditions"))
    }

    override fun onSaveHealthCard(card: InsuranceCard) {
      // The Android SDK has no card identifier, unlike iOS.
      val savedCard = mapOf(
        "id" to null,
        "name" to card.name,
        "canNumber" to card.can,
        "phoneNumber" to card.phoneNumber,
      )
      sendEvent(EVENT_CARDLINK, mapOf("event" to "cardSaved", "cards" to listOf(savedCard)))
    }

    override fun reportAnalytics(analyticEvent: String) {
      sendEvent(EVENT_ANALYTICS, analyticEvent)
    }

    override fun failedToInitializeCardlink() {
      // Called on the SDK's background thread. A scan flow started from the
      // saved cards screen can fail while that screen is still shown; its
      // closing then ends the session.
      mainHandler.post {
        if (cardLinkActivityCount == 0) isCardLinkSessionActive = false
      }
      sendEvent(EVENT_CARDLINK, mapOf("event" to "failedToInitialize", "errorMessage" to null))
    }
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  override fun getVersion(promise: Promise) {
    promise.resolve(BuildConfig.SDK_VERSION)
  }

  override fun getEnvironment(promise: Promise) {
    // Until a launch sets it, the SDK's CardLink environment is its production
    // default, while a launch without an environment follows the SDK's.
    val environment = if (hasLaunchedCardLink) {
      CardLinkSdkEnvironment.cardLinkSdkEnvironment
    } else {
      parseEnvironment(null)
    }
    promise.resolve(environment.name)
  }

  override fun getLogFilePath(promise: Promise) {
    // The SDK returns its log file's path even before anything was logged.
    promise.resolve(CardLink.getLogFilePath(reactApplicationContext).takeIf { File(it).exists() })
  }

  // ---------------------------------------------------------------------------
  // Card storage
  // ---------------------------------------------------------------------------

  override fun getSavedCards(userId: String, promise: Promise) {
    runStorageCall(promise, "GET_SAVED_CARDS_ERROR") { context ->
      Json.encodeToString(CardLink.getSavedCards(context, userId))
    }
  }

  override fun deleteCard(userId: String, cardName: String, promise: Promise) {
    if (userId.isEmpty() || cardName.isEmpty()) {
      promise.reject("INVALID_ARGUMENTS", "userId and cardName are required")
      return
    }
    runStorageCall(promise, "DELETE_CARD_ERROR") { context ->
      CardLink.deleteCard(context, cardName, userId)
      null
    }
  }

  override fun updateCard(params: ReadableMap, promise: Promise) {
    val userId = params.getStringOrNull("userId")
    val originalName = params.getStringOrNull("originalName")
    val name = params.getStringOrNull("name")
    val phoneNumber = params.getStringOrNull("phoneNumber")
    val canCode = params.getStringOrNull("canCode")
    if (userId == null || originalName == null || name == null || phoneNumber == null || canCode == null) {
      promise.reject("INVALID_ARGUMENTS", "userId, originalName, name, phoneNumber and canCode are required")
      return
    }
    runStorageCall(promise, "UPDATE_CARD_ERROR") { context ->
      CardLink.updateCard(
        context,
        originalName,
        SavedCardData(name = name, phoneNumber = phoneNumber, canCode = canCode, userId = userId),
      )
      null
    }
  }

  override fun reorderSavedCards(userId: String, orderedCanCodes: ReadableArray, promise: Promise) {
    val canCodes = orderedCanCodes.toStringList()
    runStorageCall(promise, "REORDER_SAVED_CARDS_ERROR") { context ->
      CardLink.reorderSavedCards(context, canCodes, userId)
      null
    }
  }

  override fun deleteAllCards(promise: Promise) {
    // The Android SDK can only clear all CardLink data.
    runStorageCall(promise, "DELETE_ALL_CARDS_ERROR") { context ->
      CardLink.clearAllCardLinkData(context)
      null
    }
  }

  override fun deleteAllUserRelatedData(promise: Promise) {
    runStorageCall(promise, "DELETE_ALL_USER_DATA_ERROR") { context ->
      CardLink.clearAllCardLinkData(context)
      null
    }
  }

  /**
   * Runs a blocking storage call of the SDK off the main thread, one at a time.
   */
  private fun runStorageCall(promise: Promise, errorCode: String, block: (Context) -> Any?) {
    val context: Context = reactApplicationContext.applicationContext
    scope.launch {
      try {
        val result = storageMutex.withLock {
          withContext(Dispatchers.IO) { block(context) }
        }
        promise.resolve(result)
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        promise.reject(errorCode, e.localizedMessage ?: errorCode, e)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Other
  // ---------------------------------------------------------------------------

  override fun setHostAppLogFilePath(path: String, promise: Promise) {
    // An empty path keeps the previously set file; the SDK can't detach it.
    HostAppLogProvider.initialize(path.ifEmpty { null })
    promise.resolve(null)
  }

  override fun finish(promise: Promise) {
    // The Android SDK can't close CardLink.
    promise.resolve(null)
  }

  private fun parseConsentStatus(value: String?): ConsentStatus = when (value) {
    "CONSENT_ACCEPTED" -> ConsentStatus.CONSENT_ACCEPTED
    "CONSENT_DECLINED" -> ConsentStatus.CONSENT_DECLINED
    else -> ConsentStatus.SHOW_CONSENT
  }

  /**
   * Without an environment, CardLink follows the environment the SDK was
   * initialized with.
   */
  private fun parseEnvironment(value: String?): CardLinkSdkEnvironmentType = when (value) {
    "DEBUG" -> CardLinkSdkEnvironmentType.DEBUG
    "PRODUCTION" -> CardLinkSdkEnvironmentType.PRODUCTION
    else -> when (EnvironmentType.current()) {
      EnvironmentType.PROD -> CardLinkSdkEnvironmentType.PRODUCTION
      EnvironmentType.DEV, EnvironmentType.STAGING -> CardLinkSdkEnvironmentType.DEBUG
    }
  }
}
