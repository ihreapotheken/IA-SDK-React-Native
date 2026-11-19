import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "IaSdkReactNativeExample",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    // The flavor's entry file, without ".js" (index, index.showcase, ...): the IA_JS_ENTRY build setting of the
    // scheme's configuration, see scripts/add-example-ios-flavor.rb. Release builds bundle it as main.jsbundle.
    RCTBundleURLProvider.sharedSettings().jsBundleURL(
      forBundleRoot: Bundle.main.object(forInfoDictionaryKey: "IAJSEntry") as? String ?? "index"
    )
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
