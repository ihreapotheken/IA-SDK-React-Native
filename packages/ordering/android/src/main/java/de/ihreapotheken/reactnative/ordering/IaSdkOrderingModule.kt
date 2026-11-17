package de.ihreapotheken.reactnative.ordering

import android.app.Activity
import android.app.Application
import android.os.Bundle
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.reactnative.core.IaSdkCallbacks
import de.ihreapotheken.reactnative.core.IaSdkCoreModule
import de.ihreapotheken.reactnative.core.IaSdkRuntime
import de.ihreapotheken.reactnative.core.getArrayOrNull
import de.ihreapotheken.reactnative.core.getStringOrNull
import de.ihreapotheken.reactnative.core.rejectMethod
import de.ihreapotheken.reactnative.core.toStringList
import de.ihreapotheken.sdk.core.api.PresentationMode
import de.ihreapotheken.sdk.core.api.SdkFeatureProvider
import de.ihreapotheken.sdk.core.api.listener.HandlingDecision
import de.ihreapotheken.sdk.core.api.listener.TransferPrescriptionEvent
import de.ihreapotheken.sdk.core.api.listener.TransferPrescriptionListener
import de.ihreapotheken.sdk.core.domain.model.prescription.ImagePrescription
import de.ihreapotheken.sdk.core.domain.model.prescription.PdfPrescription
import de.ihreapotheken.sdk.core.domain.model.prescription.PrescriptionInsuranceType
import de.ihreapotheken.sdk.integrations.api.IaSdk
import de.ihreapotheken.sdk.integrations.api.TransferPrescriptionRequest
import de.ihreapotheken.sdk.ordering.OrderingModule
import java.util.concurrent.atomic.AtomicBoolean

@ReactModule(name = IaSdkOrderingModule.NAME)
class IaSdkOrderingModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkOrderingSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkOrdering"
  }

  override fun getName(): String = NAME

  override fun registerModule() {
    IaSdkCoreModule.registerModuleType(OrderingModule)
  }

  override fun clearCart(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    reactApplicationContext.runOnUiQueueThread {
      if (IaSdk.ordering.deleteCart()) {
        IaSdkCallbacks.reportEmptyCart()
        promise.resolve(null)
      } else {
        promise.rejectMethod("clearCart", "Failed to clear cart data.")
      }
    }
  }

  override fun transferPrescriptions(params: ReadableMap, promise: Promise) {
    val images = try {
      decodeImages(params)
    } catch (e: IllegalArgumentException) {
      promise.reject("ARG_ERROR", "Prescription images must be base64 strings: ${e.message}")
      return
    }
    val pdfs = try {
      decodePdfs(params)
    } catch (e: IllegalArgumentException) {
      promise.reject("ARG_ERROR", "Prescription PDFs must be base64 strings: ${e.message}")
      return
    }
    val codes = params.getArrayOrNull("codes")?.toStringList() ?: emptyList()
    val orderId = params.getStringOrNull("orderId")
    val presentationMode = if (params.getStringOrNull("finishAction") == "showBottomSheet") {
      PresentationMode.OVERLAY
    } else {
      PresentationMode.FULL_FLOW
    }

    if (!IaSdkRuntime.requireInitialized(promise)) return
    reactApplicationContext.runOnUiQueueThread {
      val activity = reactApplicationContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Transferring prescriptions needs an activity.")
        return@runOnUiQueueThread
      }
      if (SdkFeatureProvider.orderingFeatureProvider == null) {
        // The SDK would only show a "not included in your subscription"
        // message and never report back.
        promise.rejectMethod(
          "transferPrescriptions",
          "Ordering isn't available. Is the ordering module registered and entitled?",
        )
        return@runOnUiQueueThread
      }

      // The listener can report several events, but a promise settles once.
      val hasReplied = AtomicBoolean(false)
      // Closing the transfer screen during the upload cancels it without a
      // listener event.
      val transferScreenWatcher = TransferScreenWatcher(activity.application) {
        if (!hasReplied.getAndSet(true)) {
          promise.reject(
            "PRESCRIPTION_TRANSFER_ERROR",
            "The transfer screen was closed before the transfer finished.",
          )
        }
      }
      fun resolve() {
        transferScreenWatcher.stop()
        if (!hasReplied.getAndSet(true)) promise.resolve(null)
      }

      val isStarted = IaSdk.ordering.transferPrescriptions(
        context = activity,
        transferPrescriptionRequest = TransferPrescriptionRequest(
          images = images,
          pdfs = pdfs,
          codes = codes,
          orderId = orderId,
        ),
        presentationMode = presentationMode,
        transferPrescriptionListener = object : TransferPrescriptionListener {
          override fun onTransferPrescriptionEvent(event: TransferPrescriptionEvent): HandlingDecision {
            if (event is TransferPrescriptionEvent.Loading && presentationMode == PresentationMode.FULL_FLOW) {
              // In this mode the SDK reports no success: it opens the cart,
              // which reports the updated cart.
              IaSdkCallbacks.onNextCartChange { resolve() }
            }
            if (event is TransferPrescriptionEvent.Success) {
              resolve()
            }
            if (event is TransferPrescriptionEvent.Failed) {
              transferScreenWatcher.stop()
              if (!hasReplied.getAndSet(true)) {
                promise.reject("PRESCRIPTION_TRANSFER_ERROR", event.errorMessage)
              }
            }
            // Closing the confirmation sheet reports success without the
            // cart; the SDK only closes its screen when that's handled, and
            // opens the cart otherwise.
            if (event is TransferPrescriptionEvent.Success && !event.navigateToCart) {
              return HandlingDecision.HANDLED
            }
            return HandlingDecision.PERFORM_DEFAULT
          }
        },
      )
      // The SDK returns false without calling the listener, for example
      // before it's initialized.
      if (!isStarted) {
        transferScreenWatcher.stop()
        if (!hasReplied.getAndSet(true)) {
          promise.reject(
            "PRESCRIPTION_TRANSFER_ERROR",
            "The SDK couldn't start the prescription transfer. Is it initialized?",
          )
        }
      }
    }
  }

  private fun decodeImages(params: ReadableMap): List<ImagePrescription> {
    val images = params.getArrayOrNull("images") ?: return emptyList()
    return (0 until images.size()).mapNotNull { index ->
      if (images.getType(index) != ReadableType.String) return@mapNotNull null
      ImagePrescription(Base64.decode(images.getString(index), Base64.DEFAULT))
    }
  }

  private fun decodePdfs(params: ReadableMap): List<PdfPrescription> {
    val pdfs = params.getArrayOrNull("pdfs") ?: return emptyList()
    return (0 until pdfs.size()).mapNotNull { index ->
      if (pdfs.getType(index) != ReadableType.Map) return@mapNotNull null
      val pdf = pdfs.getMap(index) ?: return@mapNotNull null
      val data = pdf.getStringOrNull("data") ?: return@mapNotNull null
      val insuranceType = when (pdf.getStringOrNull("insuranceType")) {
        "privateInsurance" -> PrescriptionInsuranceType.PRIVATE
        else -> PrescriptionInsuranceType.PUBLIC
      }
      PdfPrescription(insuranceType, Base64.decode(data, Base64.DEFAULT))
    }
  }

  /**
   * Watches the first SDK screen that opens after it's created, the
   * prescription transfer's, and calls [onClosed] when that screen closes for
   * good. A screen recreated after a configuration change is watched again.
   */
  private class TransferScreenWatcher(
    private val application: Application?,
    private val onClosed: () -> Unit,
  ) : Application.ActivityLifecycleCallbacks {
    private var transferScreen: Activity? = null

    init {
      application?.registerActivityLifecycleCallbacks(this)
    }

    fun stop() {
      application?.unregisterActivityLifecycleCallbacks(this)
      transferScreen = null
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
      if (transferScreen == null && activity.javaClass.name.startsWith("de.ihreapotheken.sdk.")) {
        transferScreen = activity
      }
    }

    override fun onActivityDestroyed(activity: Activity) {
      if (activity !== transferScreen) return
      transferScreen = null
      if (activity.isFinishing) {
        stop()
        onClosed()
      }
    }

    override fun onActivityStarted(activity: Activity) = Unit
    override fun onActivityResumed(activity: Activity) = Unit
    override fun onActivityPaused(activity: Activity) = Unit
    override fun onActivityStopped(activity: Activity) = Unit
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
  }
}
