package iasdkreactnative.example

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

  private val defaultReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  /**
   * The app runs on the New Architecture (newArchEnabled=true), so React Native starts up through
   * [ReactHost] built from the configuration above.
   */
  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(applicationContext, defaultReactNativeHost)
  }

  /**
   * The legacy bridge host is deprecated in the New Architecture and unused by this app at runtime,
   * but [ReactApplication] still declares it and RN internals such as HeadlessJsTaskService and
   * ReactFragment resolve it from the application, so it is served from the same configuration.
   */
  @Deprecated("Deprecated in the New Architecture; this app runs off reactHost.")
  @Suppress("DEPRECATION")
  override val reactNativeHost: com.facebook.react.ReactNativeHost
    get() = defaultReactNativeHost

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
