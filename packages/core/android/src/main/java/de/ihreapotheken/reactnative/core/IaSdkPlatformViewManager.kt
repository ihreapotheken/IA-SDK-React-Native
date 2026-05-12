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
import de.ihreapotheken.sdk.core.api.featureproviders.ProductType
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

  private val preDrawListener = ViewTreeObserver.OnPreDrawListener {
    measureAndReport()
    true
  }

  init {
    addView(composeView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    composeView.viewTreeObserver.addOnPreDrawListener(preDrawListener)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    applyContent()
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
    identifierState.value = IaComponentIdentifier.fromViewTypeId(viewId)
    composeView.post { measureAndReport() }
  }

  fun updateComponentParams(params: ReadableMap?) {
    paramsState.value = params?.toHashMap() ?: emptyMap()
    composeView.post { measureAndReport() }
  }

  fun dispose() {
    if (composeView.viewTreeObserver.isAlive) {
      composeView.viewTreeObserver.removeOnPreDrawListener(preDrawListener)
    }
  }

  private fun measureAndReport() {
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

  @Composable
  private fun Render(identifier: IaComponentIdentifier, params: Map<String, Any?>) {
    when (identifier) {
      IaComponentIdentifier.CartButton -> IaCartButton(Modifier)
      IaComponentIdentifier.ProductGrid -> {
        val pzn = params["pzn"] as? String
        val productType: ProductType = when (params["type"] as? String) {
          "productsOfTheMonth" -> ProductType.ProductOfTheMonths
          "productRecommendations" -> ProductType.ProductRecommendations(pzn ?: "")
          "customersAlsoBought" -> ProductType.CustomersAlsoBought(pzn ?: "")
          else -> ProductType.CurrentOffers
        }
        val showLoading = params["shouldShowLoading"] as? Boolean ?: true
        IaProductGrid(productType = productType, showLoading = showLoading)
      }
    }
  }
}
