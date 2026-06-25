package de.ihreapotheken.reactnative.core

import android.app.Activity
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.sdk.core.data.EnvironmentType
import de.ihreapotheken.sdk.core.data.PrerequisiteFlowConfiguration
import de.ihreapotheken.sdk.core.data.model.sdk.SdkEvent
import de.ihreapotheken.sdk.core.data.model.sdk.SdkEventListener
import de.ihreapotheken.sdk.core.domain.model.GuestUser
import de.ihreapotheken.sdk.core.SdkModule
import de.ihreapotheken.sdk.integrations.api.IaSdk
import de.ihreapotheken.sdk.integrations.api.IaSdkConfiguration
import de.ihreapotheken.sdk.integrations.api.view.IaSdkActivity
import de.ihreapotheken.sdk.integrations.api.view.IaScreen
import android.util.Log

@ReactModule(name = IaSdkCoreModule.NAME)
class IaSdkCoreModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkCoreSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkCore"

    // Track registered modules for dynamic registration
    private val registeredModuleTypes = mutableListOf<SdkModule>()

    /**
     * Register a module type to be included during SDK initialization.
     * Called by feature modules during their registration.
     */
    fun registerModuleType(moduleType: SdkModule) {
      if (!registeredModuleTypes.contains(moduleType)) {
        registeredModuleTypes.add(moduleType)
      }
    }
  }

  override fun getName(): String {
    return NAME
  }

  lateinit var sdkModule: IaSdk

  override fun initIaSdkAndroid(
    accessKey: String,
    clientId: String,
    serverEnvironmentId: String,
    channelId: Double?,
    shouldFetchThemeFromRemote: Boolean,
    completionHandler: Callback,
  ) {
    // Register SDK with dynamically registered modules
    sdkModule = if (registeredModuleTypes.isEmpty()) {
      IaSdk.register()
    } else {
      IaSdk.register(*registeredModuleTypes.toTypedArray())
    }

    val serverEnv = when (serverEnvironmentId.lowercase()) {
      "development" -> EnvironmentType.DEV
      "staging" -> EnvironmentType.STAGING
      "production" -> EnvironmentType.PROD
      else -> EnvironmentType.STAGING
    }

    sdkModule.init(
      context = reactApplicationContext.applicationContext,
      apiKey = accessKey,
      clientId = clientId,
      configuration = IaSdkConfiguration(
        shouldFetchThemeFromRemote = shouldFetchThemeFromRemote,
        prerequisiteFlowConfiguration = PrerequisiteFlowConfiguration(
          shouldRunLegal = true,
          shouldRunOnboarding = false,
        ),
        channelId = channelId?.toInt(),
      ),
      environmentType = serverEnv,
      sdkEventListener = object : SdkEventListener {
        override fun onSdkEvent(event: SdkEvent) {
          Log.d("IaSdkCoreModule", "SDK Event received: $event")
          if (event is SdkEvent.InitStatus && event !is SdkEvent.InitStatus.Initializing) {
              Log.d("IaSdkCoreModule", "SDK initialization completed")
              completionHandler.invoke(null)
          } else if (event is SdkEvent.InitError) {
              Log.e("IaSdkCoreModule", "SDK init error: ${event.message}")
              completionHandler.invoke(event.message)
          }
        }
      }
    )
  }

  override fun startDashboardActivityAndroid() {
    val context: Context = reactApplicationContext.currentActivity ?: reactApplicationContext.applicationContext
    val intent = Intent(
      context,
      IaSdkActivity::class.java,
    )
    if (context !is Activity) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    intent.putExtra("viewId", IaScreen.StartScreen::class.simpleName!!)
    context.startActivity(intent)
  }

  override fun launchApofinderAndroid() {
    val context: Context = reactApplicationContext.currentActivity ?: reactApplicationContext.applicationContext
    val intent = Intent(
      context,
      IaSdkActivity::class.java,
    )
    if (context !is Activity) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    intent.putExtra("viewId", IaScreen.ApofinderScreen::class.simpleName!!)
    context.startActivity(intent)
  }

  override fun logoutAndroid(completionHandler: Callback) {
    val success = sdkModule.clearAllData()
    if (success) {
      completionHandler.invoke(null)
    } else {
      completionHandler.invoke("Failed to logout.")
    }
  }

  override fun setGuestUserDataAndroid(
    salutation: String,
    firstName: String,
    lastName: String,
    email: String,
    phoneNumberCountryCode: String?,
    phoneNumberWithoutCountryCode: String?,
    completionHandler: Callback,
  ) {
    val guestUserData = GuestUser(
      salutation,
      firstName,
      lastName,
      email,
      if (phoneNumberCountryCode != null) {
        phoneNumberCountryCode.toIntOrNull() ?: 49
      } else {
        null
      },
      phoneNumberWithoutCountryCode,
    )
    sdkModule.setUserData(guestUserData)
    completionHandler.invoke(null)
  }

  override fun finishAllActivitiesAndroid() {
    IaSdkActivity.finishAllActivities()
  }

  override fun transferSDKv1UserDataAndroid() {
    IaSdk.transferSDKv1UserData(reactApplicationContext.applicationContext)
  }

  override fun isInitializedAndroid(completionHandler: Callback) {
    val isInitialized = IaSdk.isInitialized()
    completionHandler.invoke(isInitialized)
  }
}
