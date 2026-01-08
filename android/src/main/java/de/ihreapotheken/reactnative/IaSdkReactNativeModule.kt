package de.ihreapotheken.reactnative

import android.app.Activity
import android.content.Context
import android.content.Intent
import androidx.lifecycle.MutableLiveData
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.sdk.apofinder.ApofinderModule
import de.ihreapotheken.sdk.core.api.PresentationMode
import de.ihreapotheken.sdk.core.api.listener.CheckoutListener
import de.ihreapotheken.sdk.core.api.listener.HandlingDecision
import de.ihreapotheken.sdk.core.api.listener.TransferPrescriptionEvent
import de.ihreapotheken.sdk.core.api.listener.TransferPrescriptionListener
import de.ihreapotheken.sdk.core.data.EnvironmentType
import de.ihreapotheken.sdk.core.data.PrerequisiteFlowConfiguration
import de.ihreapotheken.sdk.core.data.model.sdk.SdkEvent
import de.ihreapotheken.sdk.core.data.model.sdk.SdkEventListener
import de.ihreapotheken.sdk.core.domain.model.GuestUser
import de.ihreapotheken.sdk.integrations.api.IaSdk
import de.ihreapotheken.sdk.integrations.api.IaSdkConfiguration
import de.ihreapotheken.sdk.integrations.api.TransferPrescriptionRequest
import de.ihreapotheken.sdk.integrations.api.view.IaSdkActivity
import de.ihreapotheken.sdk.integrations.api.view.IaScreen
import de.ihreapotheken.sdk.ordering.OrderingModule
import de.ihreapotheken.sdk.otc.OtcModule
import de.ihreapotheken.sdk.pharmacy.PharmacyModule

@ReactModule(name = IaSdkReactNativeModule.NAME)
class IaSdkReactNativeModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkReactNativeSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkReactNative"
  }

  override fun getName(): String {
    return NAME
  }

  lateinit var sdkModule: IaSdk

  private fun notifyJs(
    id: String,
    message: String,
  ) {
    val params = Arguments.createMap()
    params.putString("data", message)
    reactApplicationContext
      .getJSModule(ReactContext.RCTDeviceEventEmitter::class.java)
      .emit(id, message)
  }

  override fun initIaSdkAndroid(
    accessKey: String,
    clientId: String,
    serverEnvironmentId: String,
  ) {
    val channelId = "INIT_EVENT"
    sdkModule = IaSdk.register(
      OtcModule,
      OrderingModule,
      PharmacyModule,
      ApofinderModule,
    )
    val serverEnv = when (serverEnvironmentId.lowercase()) {
      "development" -> {
        EnvironmentType.DEV
      }
      "staging" -> {
        EnvironmentType.STAGING
      }
      "production" -> {
        EnvironmentType.PROD
      }
      else -> {
        EnvironmentType.STAGING
      }
    }
    sdkModule.init(
      context = reactApplicationContext.applicationContext,
      apiKey = accessKey,
      clientId = clientId,
      configuration = IaSdkConfiguration(
        shouldFetchThemeFromRemote = true,
        prerequisiteFlowConfiguration = PrerequisiteFlowConfiguration(
          shouldRunLegal = true,
          shouldRunOnboarding = false,
        ),
      ),
      environmentType = serverEnv,
      sdkEventListener = object : SdkEventListener {
        override fun onSdkEvent(event: SdkEvent) {
          if (event is SdkEvent.InitStatus && event !is SdkEvent.InitStatus.Initializing) {
            notifyJs(channelId, "success")
          }
          if (event is SdkEvent.InitError) {
            notifyJs(channelId, event.message)
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

  override fun logoutAndroid() {
    val channelId = "LOGOUT_EVENT"
    val success = sdkModule.clearAllData()
    if (success) {
        notifyJs(channelId, "success")
    } else {
        notifyJs(channelId, "Failed to logout.")
    }
  }

  override fun setGuestUserDataAndroid(
    salutation: String,
    firstName: String,
    lastName: String,
    email: String,
    phoneNumberCountryCode: String?,
    phoneNumberWithoutCountryCode: String?,
  ) {
    val channelId = "SET_GUEST_DATA_EVENT"
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
    sdkModule.setUserData(
        guestUserData
    )
    notifyJs(channelId, "success")
  }

  override fun clearCartAndroid() {
    val channelId = "CLEAR_CART_EVENT"
    val success = sdkModule.ordering.deleteCart()
    if (success) {
        notifyJs(channelId, "success")
    } else {
        notifyJs(channelId, "Error clearing cart.")
    }
  }

  /**
   * Data class to hold a user's address in [PersonalData].
   */
  data class SignatureCodes(
    val iaOrderCode: String,
    val hostOrderCode: String,
  )

  /**
   * Property holding the value of the [orderSignatureListener].
   */
  var orderSignatures: MutableLiveData<SignatureCodes?> = MutableLiveData<SignatureCodes?>(null)

  /**
   * Notifier implemented for receiving value updates on order IDs with prescription transfer completion.
   */
  val orderSignaturesListener: MutableLiveData<SignatureCodes?> by lazy {
    orderSignatures
  }

  override fun transferPrescriptionsAndroid(
    images: ReadableArray?,
    pdfs: ReadableArray?,
    codes: ReadableArray?,
    orderId: String?,
  ) {
    val channelId = "TRANSFER_PRESCRIPTIONS_EVENT"
    val imagesList = ArrayList<ByteArray>()
    if (images != null) {
      for (i in 0 until images.size()) {
        val base64 = images.getString(i)
        val bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT)
        imagesList.add(bytes)
      }
    }
    val pdfsList = ArrayList<ByteArray>()
    if (pdfs != null) {
      for (i in 0 until pdfs.size()) {
        val base64 = pdfs.getString(i)
        val bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT)
        pdfsList.add(bytes)
      }
    }
    val codesList = ArrayList<String>()
    if (codes != null) {
      for (i in 0 until codes.size()) {
        codesList.add(codes.getString(i) ?: "")
      }
    }
    sdkModule.ordering.deleteCart()
    IaSdk.ordering.setCheckoutListener(
      object : CheckoutListener {
        override fun onCheckoutCompleted(hostOrderId: String, sdkOrderId: String) {
          orderSignatures.value = SignatureCodes(
              iaOrderCode = sdkOrderId,
              hostOrderCode = hostOrderId,
          )
        }
      }
    )
    sdkModule.ordering.transferPrescriptions(
      context = reactApplicationContext.currentActivity!!,
      transferPrescriptionRequest = TransferPrescriptionRequest(
        imagesList,
        pdfsList,
        codesList,
        orderId,
      ),
      transferPrescriptionListener = object : TransferPrescriptionListener {
        override fun onTransferPrescriptionEvent(event: TransferPrescriptionEvent): HandlingDecision {
          if (event is TransferPrescriptionEvent.Success) {
              notifyJs(channelId, "success")
          }
          if (event is TransferPrescriptionEvent.Failed) {
              notifyJs(channelId, event.errorMessage)
          }
          return HandlingDecision.PERFORM_DEFAULT
        }
      },
      presentationMode = PresentationMode.FULL_FLOW,
    )
  }

  override fun finishAllActivitiesAndroid() {
    IaSdkActivity.finishAllActivities()
  }
}
