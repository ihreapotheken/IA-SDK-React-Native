package de.ihreapotheken.reactnative.pharmacy

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.reactnative.core.IaSdkCallbacks
import de.ihreapotheken.reactnative.core.IaSdkCoreModule
import de.ihreapotheken.reactnative.core.IaSdkRuntime
import de.ihreapotheken.reactnative.core.rejectMethod
import de.ihreapotheken.sdk.core.api.listener.PharmacyConfigListener
import de.ihreapotheken.sdk.core.api.listener.PharmacyConfigResult
import de.ihreapotheken.sdk.integrations.api.IaSdk
import de.ihreapotheken.sdk.pharmacy.PharmacyModule
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean

@ReactModule(name = IaSdkPharmacyModule.NAME)
class IaSdkPharmacyModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkPharmacySpec(reactContext) {
  companion object {
    const val NAME = "IaSdkPharmacy"
  }

  private val scope = MainScope()

  override fun getName(): String = NAME

  override fun invalidate() {
    scope.cancel()
    super.invalidate()
  }

  override fun registerModule() {
    IaSdkCoreModule.registerModuleType(PharmacyModule)
  }

  override fun setPharmacyId(pharmacyId: String, promise: Promise) {
    val trimmedId = pharmacyId.trim()
    if (trimmedId.toIntOrNull() == null) {
      promise.reject("ARG_ERROR", "Invalid pharmacyId \"$pharmacyId\". Expected a numeric pharmacy identifier.")
      return
    }
    if (!IaSdkRuntime.requireInitialized(promise)) return
    val hasReplied = AtomicBoolean(false)
    reactApplicationContext.runOnUiQueueThread {
      IaSdk.pharmacy.setPharmacyId(
        trimmedId,
        object : PharmacyConfigListener {
          override fun onPharmacyConfigResult(pharmacyConfigResult: PharmacyConfigResult) {
            if (hasReplied.getAndSet(true)) return
            if (pharmacyConfigResult is PharmacyConfigResult.NotInitialized ||
              pharmacyConfigResult is PharmacyConfigResult.ValidationFailed
            ) {
              promise.reject(
                "SET_PHARMACY_ERROR",
                "Setting pharmacy ID failed: ${pharmacyConfigResult::class.simpleName}",
              )
            } else {
              promise.resolve(null)
            }
          }
        },
      )
    }
  }

  override fun getPharmacyId(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    scope.launch {
      try {
        promise.resolve(IaSdk.pharmacy.getPharmacyId().ifEmpty { null })
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        promise.rejectMethod("getPharmacyId", e.message, e)
      }
    }
  }

  override fun clearPharmacyId(promise: Promise) {
    if (!IaSdkRuntime.requireInitialized(promise)) return
    scope.launch {
      try {
        // The SDK empties the cart of the cleared pharmacy too.
        IaSdk.pharmacy.clearPharmacyId()
        IaSdkCallbacks.reportEmptyCart()
        promise.resolve(null)
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        promise.rejectMethod("clearPharmacyId", e.message, e)
      }
    }
  }
}
