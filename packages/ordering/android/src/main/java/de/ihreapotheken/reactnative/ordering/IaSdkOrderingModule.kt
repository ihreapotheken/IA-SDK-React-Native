package de.ihreapotheken.reactnative.ordering

import android.app.Activity
import android.content.Context
import android.content.Intent
import androidx.lifecycle.MutableLiveData
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.sdk.core.api.PresentationMode
import de.ihreapotheken.sdk.core.api.listener.CheckoutListener
import de.ihreapotheken.sdk.core.api.listener.HandlingDecision
import de.ihreapotheken.sdk.core.api.listener.TransferPrescriptionEvent
import de.ihreapotheken.sdk.core.api.listener.TransferPrescriptionListener
import de.ihreapotheken.sdk.core.data.model.prescription.ImagePrescription
import de.ihreapotheken.sdk.core.data.model.prescription.PdfPrescription
import de.ihreapotheken.sdk.core.data.model.prescription.PrescriptionInsuranceType
import de.ihreapotheken.sdk.integrations.api.IaSdk
import de.ihreapotheken.sdk.integrations.api.TransferPrescriptionRequest
import de.ihreapotheken.sdk.integrations.api.view.IaSdkActivity
import de.ihreapotheken.sdk.integrations.api.view.IaScreen
import de.ihreapotheken.sdk.ordering.OrderingModule
import de.ihreapotheken.reactnative.core.IaSdkCoreModule

@ReactModule(name = IaSdkOrderingModule.NAME)
class IaSdkOrderingModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkOrderingSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkOrdering"
  }

  override fun getName(): String {
    return NAME
  }

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

  override fun registerModule() {
    // Register ordering module with core SDK
    IaSdkCoreModule.registerModuleType(OrderingModule)
  }

  override fun clearCartAndroid() {
    val channelId = "CLEAR_CART_EVENT"
    val success = IaSdk.ordering.deleteCart()
    if (success) {
      notifyJs(channelId, "success")
    } else {
      notifyJs(channelId, "Error clearing cart.")
    }
  }

  /**
   * Data class to hold order signature codes.
   */
  data class SignatureCodes(
    val iaOrderCode: String,
    val hostOrderCode: String,
  )

  /**
   * Property holding the value of the orderSignatureListener.
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
    android.util.Log.d("IaSdkOrdering", "transferPrescriptionsAndroid called")
    android.util.Log.d("IaSdkOrdering", "images count: ${images?.size() ?: 0}")
    android.util.Log.d("IaSdkOrdering", "pdfs count: ${pdfs?.size() ?: 0}")
    android.util.Log.d("IaSdkOrdering", "codes count: ${codes?.size() ?: 0}")
    android.util.Log.d("IaSdkOrdering", "orderId: $orderId")

    val channelId = "TRANSFER_PRESCRIPTIONS_EVENT"
    val imagePrescriptions = ArrayList<ImagePrescription>()
    if (images != null) {
      for (i in 0 until images.size()) {
        val base64 = images.getString(i)
        android.util.Log.d("IaSdkOrdering", "image[$i] base64 length: ${base64?.length ?: 0}")
        if (base64 != null) {
          try {
            val bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT)
            android.util.Log.d("IaSdkOrdering", "image[$i] decoded: ${bytes.size} bytes")
            imagePrescriptions.add(ImagePrescription(bytes))
          } catch (e: IllegalArgumentException) {
            android.util.Log.e("IaSdkOrdering", "image[$i] decode failed: ${e.message}")
          }
        }
      }
    }
    val pdfPrescriptions = ArrayList<PdfPrescription>()
    if (pdfs != null) {
      for (i in 0 until pdfs.size()) {
        val pdfMap = pdfs.getMap(i)
        val base64 = pdfMap?.getString("data")
        val insuranceTypeStr = pdfMap?.getString("insuranceType")
        android.util.Log.d("IaSdkOrdering", "pdf[$i] base64 length: ${base64?.length ?: 0}, insuranceType: $insuranceTypeStr")
        if (base64 != null) {
          try {
            val bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT)
            val insuranceType = when (insuranceTypeStr) {
              "privateInsurance" -> PrescriptionInsuranceType.PRIVATE
              "publicHealthcare" -> PrescriptionInsuranceType.PUBLIC
              else -> PrescriptionInsuranceType.PUBLIC
            }
            android.util.Log.d("IaSdkOrdering", "pdf[$i] decoded: ${bytes.size} bytes")
            pdfPrescriptions.add(PdfPrescription(insuranceType, bytes))
          } catch (e: IllegalArgumentException) {
            android.util.Log.e("IaSdkOrdering", "pdf[$i] decode failed: ${e.message}")
          }
        }
      }
    }
    val codesList = ArrayList<String>()
    if (codes != null) {
      for (i in 0 until codes.size()) {
        val code = codes.getString(i) ?: ""
        android.util.Log.d("IaSdkOrdering", "code[$i]: $code")
        codesList.add(code)
      }
    }
    android.util.Log.d("IaSdkOrdering", "Final imagePrescriptions size: ${imagePrescriptions.size}")
    android.util.Log.d("IaSdkOrdering", "Final pdfPrescriptions size: ${pdfPrescriptions.size}")
    android.util.Log.d("IaSdkOrdering", "Final codesList size: ${codesList.size}")
    IaSdk.ordering.deleteCart()
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
    IaSdk.ordering.transferPrescriptions(
      context = reactApplicationContext.currentActivity!!,
      transferPrescriptionRequest = TransferPrescriptionRequest(
        images = imagePrescriptions,
        pdfs = pdfPrescriptions,
        codes = codesList,
        orderId = orderId,
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

  override fun launchCartScreenAndroid() {
    val context: Context = reactApplicationContext.currentActivity ?: reactApplicationContext.applicationContext
    val intent = Intent(
      context,
      IaSdkActivity::class.java,
    )
    if (context !is Activity) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    intent.putExtra("viewId", IaScreen.CartScreen::class.simpleName!!)
    context.startActivity(intent)
  }
}
