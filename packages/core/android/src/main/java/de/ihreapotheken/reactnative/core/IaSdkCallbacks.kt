package de.ihreapotheken.reactnative.core

import android.util.Base64
import de.ihreapotheken.sdk.core.api.listener.CartListener
import de.ihreapotheken.sdk.core.api.listener.CheckoutListener
import de.ihreapotheken.sdk.core.api.listener.RedeemPrescriptionDecision
import de.ihreapotheken.sdk.core.api.listener.RedeemPrescriptionEvent
import de.ihreapotheken.sdk.core.api.listener.RedeemPrescriptionListener
import de.ihreapotheken.sdk.core.api.listener.SdkImpressumListener
import de.ihreapotheken.sdk.integrations.api.analytics.ExperimentalIaAnalyticsApi
import de.ihreapotheken.sdk.integrations.api.analytics.IaAnalyticsEvent
import de.ihreapotheken.sdk.integrations.api.analytics.IaAnalyticsListener

/**
 * SDK listeners forwarding the SDK's callbacks to JS. The Android equivalent
 * of the iOS SDK delegate.
 */
@OptIn(ExperimentalIaAnalyticsApi::class)
object IaSdkCallbacks :
  CartListener,
  CheckoutListener,
  RedeemPrescriptionListener,
  SdkImpressumListener,
  IaAnalyticsListener {

  private const val SCAN_DECISION_TIMEOUT_MS = 120_000L

  /**
   * Counts of the last cart update sent. The SDK reports every time it loads
   * the cart, so a prescription transfer that loads it twice would report the
   * same cart twice.
   */
  private var lastCartCounts: Triple<Int, Int, Int>? = null

  private val nextCartChangeHandlers = mutableListOf<() -> Unit>()

  override fun onCartChanged(totalProducts: Int, totalPrescription: Int, totalItems: Int) {
    sendCartUpdate(totalProducts, totalPrescription, totalItems)
    val handlers = synchronized(nextCartChangeHandlers) {
      nextCartChangeHandlers.toList().also { nextCartChangeHandlers.clear() }
    }
    handlers.forEach { it() }
  }

  /**
   * The SDK doesn't report a cart change when the modules clear the cart.
   */
  fun reportEmptyCart() {
    sendCartUpdate(totalProducts = 0, totalPrescription = 0, totalItems = 0)
  }

  /**
   * Runs [handler] once with the next cart change the SDK reports.
   */
  fun onNextCartChange(handler: () -> Unit) {
    synchronized(nextCartChangeHandlers) {
      nextCartChangeHandlers.add(handler)
    }
  }

  @Synchronized
  private fun sendCartUpdate(totalProducts: Int, totalPrescription: Int, totalItems: Int) {
    val counts = Triple(totalProducts, totalPrescription, totalItems)
    if (counts == lastCartCounts) return
    lastCartCounts = counts
    IaSdkRuntime.emit(
      IaSdkEvents.CART_UPDATED,
      mapOf(
        "totalAmountInCart" to totalItems,
        "clientOrderIDs" to emptyList<String>(),
        "totalProducts" to totalProducts,
        "totalPrescriptions" to totalPrescription,
        "products" to null,
      ),
    )
  }

  override fun onCheckoutCompleted(hostOrderId: String, sdkOrderId: String) {
    // The SDK reports an empty host order ID when the host didn't pass one.
    IaSdkRuntime.emit(
      IaSdkEvents.ORDER_FINISHED,
      mapOf(
        "orderCode" to sdkOrderId,
        "orderCodes" to listOf(sdkOrderId),
        "clientOrderIDs" to listOf(hostOrderId).filter { it.isNotEmpty() },
      ),
    )
  }

  /**
   * Called for the imprint footer button, only while the host app handles
   * the imprint. The SDK then doesn't open its own imprint page.
   */
  override fun onImpressumClick() {
    IaSdkRuntime.notify(IaSdkRequestTypes.NAVIGATION, mapOf("navigationTarget" to "imprint"))
  }

  override fun onEvent(event: IaAnalyticsEvent) {
    IaSdkRuntime.emit(
      IaSdkEvents.ANALYTICS_EVENT,
      mapOf("name" to event.name, "parameters" to event.parameters),
    )
  }

  /**
   * Asks JS whether the SDK continues with its default handling of a scanned
   * prescription. Without an answer it does.
   */
  override suspend fun onRedeemPrescriptionEvent(event: RedeemPrescriptionEvent): RedeemPrescriptionDecision {
    val (type, payload) = when (event) {
      is RedeemPrescriptionEvent.PrescriptionPhotoScanned ->
        IaSdkRequestTypes.PRESCRIPTION_PHOTO_SCANNED to
          mapOf("imageData" to Base64.encodeToString(event.imageData, Base64.NO_WRAP))
      is RedeemPrescriptionEvent.EPrescriptionScanned ->
        IaSdkRequestTypes.E_PRESCRIPTION_SCANNED to
          mapOf("rawCode" to event.rawCode, "urls" to event.urls)
    }
    val response = IaSdkRuntime.request(type, payload, SCAN_DECISION_TIMEOUT_MS)
    return when (response?.get("decision")) {
      "handled" -> RedeemPrescriptionDecision.Handled
      "error" -> RedeemPrescriptionDecision.Error(response["message"] as? String ?: "")
      else -> RedeemPrescriptionDecision.PerformDefault
    }
  }
}
