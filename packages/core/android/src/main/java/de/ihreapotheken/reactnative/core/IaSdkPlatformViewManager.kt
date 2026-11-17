package de.ihreapotheken.reactnative.core

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewTreeObserver
import android.widget.FrameLayout
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import android.util.Log
import de.ihreapotheken.sdk.core.api.featureproviders.ProductType
import de.ihreapotheken.sdk.integrations.api.view.IaScreen
import de.ihreapotheken.sdk.integrations.api.view.IaSdkView
import de.ihreapotheken.sdk.integrations.api.view.SdkEntryPoint
import de.ihreapotheken.sdk.integrations.api.view.components.IaCartButton
import de.ihreapotheken.sdk.integrations.api.view.components.IaProductGrid

internal enum class IaComponentIdentifier(val viewTypeId: String) {
  CartButton("cartButton"),
  ProductGrid("productGrid"),
  ;

  companion object {
    fun fromViewTypeId(id: String?): IaComponentIdentifier? {
      return entries.firstOrNull { it.viewTypeId == id }
    }
  }
}

/**
 * SDK screens the platform view embeds, by their JS view id
 * (`IaSdkScreenViewId`).
 */
internal fun screenEntryPoint(viewId: String?): SdkEntryPoint<*>? = when (viewId) {
  "startScreen" -> IaScreen.StartScreen
  "searchScreen" -> IaScreen.SearchScreen
  "cartScreen" -> IaScreen.CartScreen
  "pharmacyScreen" -> IaScreen.PharmacyScreen
  "apofinderScreen" -> IaScreen.ApofinderScreen
  "redeemPrescription" -> IaScreen.RedeemPrescription
  else -> null
}

class IaSdkPlatformViewManager(
  private val reactContext: ReactApplicationContext,
) : SimpleViewManager<IaSdkPlatformHostView>() {
  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): IaSdkPlatformHostView {
    return IaSdkPlatformHostView(context, reactContext)
  }

  @ReactProp(name = "viewId")
  fun setViewId(view: IaSdkPlatformHostView, viewId: String?) {
    view.updateViewId(viewId)
  }

  @ReactProp(name = "componentParams")
  fun setComponentParams(view: IaSdkPlatformHostView, params: ReadableMap?) {
    view.updateComponentParams(params)
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.of(
      "onSizeChange",
      MapBuilder.of("registrationName", "onSizeChange"),
      "onComponentTap",
      MapBuilder.of("registrationName", "onComponentTap"),
      // Only reported on iOS, where embedded screens can show a back or close button.
      "onScreenDismiss",
      MapBuilder.of("registrationName", "onScreenDismiss"),
    )
  }

  override fun onDropViewInstance(view: IaSdkPlatformHostView) {
    view.dispose()
    super.onDropViewInstance(view)
  }

  companion object {
    const val NAME = "IaSdkPlatformView"
  }
}

private const val NAME_TAG = "IaSdkPlatformView"

class IaSdkPlatformHostView(
  context: Context,
  private val reactContext: ReactApplicationContext,
) : FrameLayout(context) {
  private val identifierState = mutableStateOf<IaComponentIdentifier?>(null)
  private val paramsState = mutableStateOf<Map<String, Any?>>(emptyMap())
  private val composeView: ComposeView = ComposeView(context)

  private val mainHandler = Handler(Looper.getMainLooper())
  private var lastReportedWidth = -1
  private var lastReportedHeight = -1

  /** The embedded SDK screen, shown instead of [composeView] for screen view ids. */
  private var screenView: View? = null
  private var screenViewId: String? = null

  private val preDrawListener = ViewTreeObserver.OnPreDrawListener {
    measureAndReport()
    true
  }

  private val layoutScreen = Runnable {
    // Measuring the screen outside a window composes it without the
    // activity's lifecycle and view model owners, which the SDK screen
    // crashes on, for example right after the app removed this view.
    if (!isAttachedToWindow || width == 0 || height == 0) return@Runnable
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
    )
    layout(left, top, right, bottom)
  }

  /**
   * React Native positions its views itself and ignores layout requests from
   * native children, so an embedded screen would keep its first layout. This
   * lays it out again while in a window. (FrameLayout's constructor calls this
   * before the properties are set, while [screenView] is still null.)
   */
  override fun requestLayout() {
    super.requestLayout()
    if (screenView != null && isAttachedToWindow) post(layoutScreen)
  }

  init {
    addView(composeView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    composeView.viewTreeObserver.addOnPreDrawListener(preDrawListener)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    applyContent()
  }

  override fun onDetachedFromWindow() {
    removeCallbacks(layoutScreen)
    super.onDetachedFromWindow()
  }

  override fun onWindowFocusChanged(hasWindowFocus: Boolean) {
    super.onWindowFocusChanged(hasWindowFocus)
    if (hasWindowFocus) {
      applyContent()
    }
  }

  private fun applyContent() {
    composeView.setContent {
      val identifier = identifierState.value ?: return@setContent
      val params = paramsState.value
      Render(identifier, params)
    }
  }

  fun updateViewId(viewId: String?) {
    val entryPoint = screenEntryPoint(viewId)
    if (viewId != null && entryPoint != null) {
      identifierState.value = null
      showScreen(viewId, entryPoint)
      return
    }
    removeScreen()
    identifierState.value = IaComponentIdentifier.fromViewTypeId(viewId)
    composeView.post { measureAndReport() }
  }

  private fun showScreen(viewId: String, entryPoint: SdkEntryPoint<*>) {
    if (viewId == screenViewId) return
    removeScreen()
    // The SDK builds the screen with the activity, and fails without one.
    val view = try {
      IaSdkView.createView(
        reactContext.currentActivity ?: context,
        entryPoint,
        onNavigateToTarget = { target -> IaSdkRuntime.handleNavigationTarget(target) },
      )
    } catch (e: IllegalStateException) {
      Log.w(NAME_TAG, "Couldn't embed $viewId: ${e.message}")
      return
    }
    composeView.visibility = GONE
    screenView = view
    screenViewId = viewId
    addView(view, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

  private fun removeScreen() {
    screenView?.let { removeView(it) }
    screenView = null
    screenViewId = null
    composeView.visibility = VISIBLE
  }

  fun updateComponentParams(params: ReadableMap?) {
    paramsState.value = params?.toHashMap() ?: emptyMap()
    composeView.post { measureAndReport() }
  }

  fun dispose() {
    removeCallbacks(layoutScreen)
    if (composeView.viewTreeObserver.isAlive) {
      composeView.viewTreeObserver.removeOnPreDrawListener(preDrawListener)
    }
  }

  private fun measureAndReport() {
    // Embedded screens fill the size the app gives them.
    if (screenView != null) return
    val parentWidth = composeView.width
    if (parentWidth <= 0) return

    composeView.forceLayout()
    composeView.measure(
      MeasureSpec.makeMeasureSpec(parentWidth, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
    )
    val width = composeView.measuredWidth
    val height = composeView.measuredHeight
    if (width <= 0 || height < 0) return
    if (width == lastReportedWidth && height == lastReportedHeight) return
    lastReportedWidth = width
    lastReportedHeight = height

    val density = resources.displayMetrics.density
    val widthDp = width / density
    val heightDp = height / density

    mainHandler.post {
      val map = Arguments.createMap().apply {
        putDouble("width", widthDp.toDouble())
        putDouble("height", heightDp.toDouble())
      }
      reactContext
        .getJSModule(RCTEventEmitter::class.java)
        .receiveEvent(id, "onSizeChange", map)
    }
  }

  private fun reportTap() {
    mainHandler.post {
      reactContext
        .getJSModule(RCTEventEmitter::class.java)
        .receiveEvent(id, "onComponentTap", Arguments.createMap())
    }
  }

  @Composable
  private fun Render(identifier: IaComponentIdentifier, params: Map<String, Any?>) {
    when (identifier) {
      IaComponentIdentifier.CartButton -> {
        val hasTapHandler = params["hasTapHandler"] == true
        IaCartButton(
          Modifier,
          onClick = {
            if (hasTapHandler) {
              reportTap()
            } else {
              // The SDK's own click opens the cart without asking the
              // navigation handler.
              IaSdkRuntime.openCartFromCartButton(context)
            }
          },
        )
      }
      IaComponentIdentifier.ProductGrid -> {
        val pzn = params["pzn"] as? String
        val productType: ProductType = when (params["type"] as? String) {
          "productsOfTheMonth" -> ProductType.ProductOfTheMonths
          "productRecommendations" -> ProductType.ProductRecommendations(pzn ?: "")
          "customersAlsoBought" -> ProductType.CustomersAlsoBought(pzn ?: "")
          "custom" -> ProductType.Custom(
            title = params["title"] as? String ?: "",
            pzns = (params["pzns"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
          )
          else -> ProductType.CurrentOffers
        }
        val showLoading = params["shouldShowLoading"] as? Boolean ?: true
        IaProductGrid(productType = productType, showLoading = showLoading)
      }
    }
  }
}
