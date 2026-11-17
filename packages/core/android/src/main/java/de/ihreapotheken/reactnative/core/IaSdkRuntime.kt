package de.ihreapotheken.reactnative.core

import android.app.Activity
import android.app.Application
import android.content.Context
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.view.View
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import de.ihreapotheken.sdk.integrations.api.IaSdk
import de.ihreapotheken.sdk.integrations.api.InitState
import de.ihreapotheken.sdk.integrations.api.view.IaPrerequisiteActivity
import de.ihreapotheken.sdk.integrations.api.view.IaScreen
import de.ihreapotheken.sdk.integrations.api.view.IaSdkActivity
import de.ihreapotheken.sdk.integrations.api.view.SdkNavigationTarget
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.Job
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import java.lang.ref.WeakReference
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong
import kotlin.coroutines.resume

/**
 * Process-wide state shared by the ia.de React Native modules: event
 * emission, native-to-JS requests and SDK screen presentation.
 *
 * It outlives JS reloads, which create new module instances that attach the
 * current React context again.
 */
object IaSdkRuntime {
  private const val TAG = "IaSdkRuntime"
  private const val NAVIGATION_TIMEOUT_MS = 1_000L
  private const val BACK_ACTION_TIMEOUT_MS = 5_000L
  private const val FINISH_ALL_WINDOW_MS = 1_000L

  private val scope = MainScope()

  @Volatile
  private var reactContextRef: WeakReference<ReactApplicationContext>? = null

  @Volatile
  private var application: Application? = null

  private var initStateJob: Job? = null

  private val requestCounter = AtomicLong()
  private val pendingRequests = ConcurrentHashMap<String, CancellableContinuation<Map<String, Any?>?>>()
  private val enabledRequestTypes: MutableSet<String> = ConcurrentHashMap.newKeySet()

  /** Elapsed realtime until which back actions close screens without asking JS. */
  @Volatile
  private var skipBackActionUntil = 0L

  /**
   * Open SDK screens, including those `IaSdkActivity.finishAllActivities`
   * doesn't close, such as the overlay of a prescription transfer with a
   * confirmation sheet. CardLink screens aren't included, like on iOS.
   */
  private val openSdkScreens: MutableSet<Activity> = ConcurrentHashMap.newKeySet()

  private val sdkScreenTracker = object : Application.ActivityLifecycleCallbacks {
    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
      val name = activity.javaClass.name
      if (name.startsWith("de.ihreapotheken.sdk.") && !name.startsWith("de.ihreapotheken.sdk.cardlink.")) {
        openSdkScreens.add(activity)
      }
      if (activity is IaPrerequisiteActivity) padForNavigationBarAndKeyboard(activity)
    }

    override fun onActivityDestroyed(activity: Activity) {
      openSdkScreens.remove(activity)
    }

    override fun onActivityStarted(activity: Activity) = Unit
    override fun onActivityResumed(activity: Activity) = Unit
    override fun onActivityPaused(activity: Activity) = Unit
    override fun onActivityStopped(activity: Activity) = Unit
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
  }

  /**
   * Attaches the current React context. Called by the core module whenever
   * it's created.
   */
  @Synchronized
  fun attach(context: ReactApplicationContext) {
    reactContextRef = WeakReference(context)
    if (application == null) {
      application = (context.applicationContext as? Application)?.also {
        it.registerActivityLifecycleCallbacks(sdkScreenTracker)
      }
    }
    if (initStateJob == null) {
      initStateJob = scope.launch {
        var lastState: InitState? = null
        IaSdk.initState.collect { state ->
          if (state == lastState) return@collect
          lastState = state
          emit(IaSdkEvents.INITIALIZATION_STATE_CHANGED, mapOf("state" to initStateName(state)))
        }
      }
    }
  }

  val reactContext: ReactApplicationContext?
    get() = reactContextRef?.get()

  fun currentActivity(): Activity? = reactContext?.currentActivity

  fun applicationContext(): Context? = reactContext?.applicationContext ?: application

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  /**
   * Emits [name] to JS with [body], a map of JSON-like values.
   */
  fun emit(name: String, body: Map<String, Any?>) {
    val context = reactContext ?: return
    try {
      context.emitDeviceEvent(name, Arguments.makeNativeMap(body))
    } catch (e: Exception) {
      Log.w(TAG, "Couldn't emit $name: ${e.message}")
    }
  }

  // ---------------------------------------------------------------------------
  // Native-to-JS requests
  // ---------------------------------------------------------------------------

  fun setRequestHandlerEnabled(type: String, enabled: Boolean) {
    if (enabled) enabledRequestTypes.add(type) else enabledRequestTypes.remove(type)
  }

  fun isRequestHandlerEnabled(type: String): Boolean = enabledRequestTypes.contains(type)

  /**
   * Asks JS for a decision and returns its response, or `null` when JS has no
   * handler for [type], doesn't answer within [timeoutMs], or the waiting
   * coroutine is cancelled.
   */
  suspend fun request(type: String, payload: Map<String, Any?>, timeoutMs: Long): Map<String, Any?>? {
    if (!isRequestHandlerEnabled(type)) return null
    return withTimeoutOrNull(timeoutMs) {
      suspendCancellableCoroutine { continuation ->
        val requestId = requestCounter.incrementAndGet().toString()
        pendingRequests[requestId] = continuation
        continuation.invokeOnCancellation { pendingRequests.remove(requestId) }
        emit(
          IaSdkEvents.REQUEST,
          mapOf("requestId" to requestId, "type" to type, "payload" to payload),
        )
      }
    }
  }

  /**
   * Tells JS about [type] without waiting for an answer.
   */
  fun notify(type: String, payload: Map<String, Any?>) {
    if (!isRequestHandlerEnabled(type)) return
    emit(IaSdkEvents.REQUEST, mapOf("type" to type, "payload" to payload))
  }

  fun respond(requestId: String, response: Map<String, Any?>?) {
    pendingRequests.remove(requestId)?.let { continuation ->
      if (continuation.isActive) continuation.resume(response)
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  fun navigationTargetName(target: SdkNavigationTarget): String? = when (target) {
    IaScreen.CartScreen -> "cart"
    IaScreen.PharmacyScreen -> "pharmacyDetails"
    IaScreen.ThankYouScreen -> "thankYou"
    IaScreen.ApofinderScreen -> "apofinder"
    IaScreen.StartScreen -> "start"
    IaScreen.SearchScreen -> "search"
    IaScreen.RedeemPrescription -> "redeemPrescription"
    IaScreen.ThankYouScreenCompleted -> "thankYouCompleted"
  }

  /**
   * Asks JS whether it handles the navigation to [target] itself. The SDK
   * waits 500 ms for the answer and then navigates itself.
   */
  suspend fun handleNavigationTarget(target: SdkNavigationTarget): Boolean {
    val name = navigationTargetName(target) ?: return false
    val response = request(
      IaSdkRequestTypes.NAVIGATION,
      mapOf("navigationTarget" to name),
      NAVIGATION_TIMEOUT_MS,
    )
    return response?.get("handled") == true
  }

  /**
   * Asks JS whether an SDK screen may close. Closes when JS doesn't answer.
   */
  suspend fun handleBackAction(): Boolean {
    // The SDK routes every close of its screens through this hook, so
    // finishAllActivities skips it.
    if (SystemClock.elapsedRealtime() < skipBackActionUntil) return true
    val response = request(IaSdkRequestTypes.BACK_ACTION, emptyMap(), BACK_ACTION_TIMEOUT_MS)
    return response?.get("shouldClose") as? Boolean ?: true
  }

  /**
   * Lets the screens closed by `IaSdkActivity.finishAllActivities` close
   * without asking JS. They close asynchronously, hence the short window.
   */
  fun skipBackActionWhileFinishingAll() {
    skipBackActionUntil = SystemClock.elapsedRealtime() + FINISH_ALL_WINDOW_MS
  }

  fun finishOpenSdkScreens() {
    openSdkScreens.toList().forEach { if (!it.isFinishing) it.finish() }
  }

  /**
   * Opens an SDK screen with the back and navigation hooks. Without an
   * activity the SDK opens it in a new task.
   *
   * @return `false` for an unknown [screen].
   */
  fun startSdkScreen(screen: String): Boolean {
    val context = currentActivity() ?: applicationContext() ?: return false
    if (screen == "apofinder") {
      IaSdkActivity.start(
        context = context,
        view = IaScreen.ApofinderScreen,
        onBackAction = { handleBackAction() },
        onNavigateToTarget = { target -> handleNavigationTarget(target) },
        onResult = { selection -> onApofinderPharmacySelected(selection.pharmacyId) },
      )
      return true
    }
    val entryPoint = when (screen) {
      "start" -> IaScreen.StartScreen
      "cart" -> IaScreen.CartScreen
      "search" -> IaScreen.SearchScreen
      "pharmacy" -> IaScreen.PharmacyScreen
      "redeemPrescription" -> IaScreen.RedeemPrescription
      else -> return false
    }
    IaSdkActivity.start(
      context = context,
      view = entryPoint,
      onBackAction = { handleBackAction() },
      onNavigateToTarget = { target -> handleNavigationTarget(target) },
    )
    return true
  }

  /**
   * Opens the SDK cart for a cart button without a JS tap handler. The SDK's
   * own button opens it without asking the navigation handler, so it's asked
   * first, with the SDK's 500 ms limit.
   */
  fun openCartFromCartButton(context: Context) {
    scope.launch {
      val isHandledByHost = withTimeoutOrNull(500) {
        handleNavigationTarget(IaScreen.CartScreen)
      } ?: false
      if (isHandledByHost) return@launch
      IaSdkActivity.start(
        context = currentActivity() ?: context,
        view = IaScreen.CartScreen,
        onBackAction = { handleBackAction() },
        onNavigateToTarget = { target -> handleNavigationTarget(target) },
      )
    }
  }

  private fun onApofinderPharmacySelected(pharmacyId: String) {
    emit(
      IaSdkEvents.APOFINDER_PHARMACY_CHANGED,
      mapOf("pharmacyId" to pharmacyId, "isFromPrerequisites" to false),
    )
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Rejects [promise] and returns `false` when the SDK isn't initialized.
   * Before its initialization the SDK silently ignores many calls, or answers
   * them with defaults, so they'd otherwise seem to succeed.
   */
  fun requireInitialized(promise: Promise): Boolean {
    if (IaSdk.isInitialized()) return true
    promise.reject(
      "SDK_NOT_INITIALIZED",
      "Call initialize first; the SDK can't handle this call before it's initialized.",
    )
    return false
  }

  fun initStateName(state: InitState): String = when (state) {
    InitState.UNINITIALIZED -> "uninitialized"
    InitState.INITIALIZING -> "initializing"
    InitState.INITIALIZED -> "initialized"
    InitState.ERROR -> "error"
  }

  /**
   * The SDK's prerequisites activity draws edge to edge, but unlike
   * `IaSdkActivity` it doesn't pad its screens for the navigation bar and the
   * keyboard, so they'd draw behind them.
   */
  private fun padForNavigationBarAndKeyboard(activity: Activity) {
    val content = activity.findViewById<View>(android.R.id.content) ?: return
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      val padding = insets.getInsets(WindowInsetsCompat.Type.navigationBars() or WindowInsetsCompat.Type.ime())
      view.setPadding(padding.left, 0, padding.right, padding.bottom)
      WindowInsetsCompat.Builder(insets)
        .setInsets(WindowInsetsCompat.Type.navigationBars(), Insets.NONE)
        .setInsets(WindowInsetsCompat.Type.ime(), Insets.NONE)
        .build()
    }
  }
}
