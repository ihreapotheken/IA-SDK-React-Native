package iasdkreactnative.example

import com.facebook.react.BaseReactPackage
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * The React Native packages of the SDK modules that only some flavors include (example/flavors.json).
 *
 * Autolinking generates one package list for every flavor, but only the flavors with a module depend on its project,
 * so the list gets these packages from here (see react-native.config.js): a flavor with the module gets its package,
 * created by class name, and a flavor without it an empty package.
 */
object FlavorPackages {
  @JvmStatic
  fun of(module: String, className: String): ReactPackage =
      if (module in BuildConfig.IA_MODULES) {
        Class.forName(className).getDeclaredConstructor().newInstance() as ReactPackage
      } else {
        EmptyPackage
      }

  private object EmptyPackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? = null

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider { emptyMap() }
  }
}
