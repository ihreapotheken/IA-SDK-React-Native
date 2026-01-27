import Foundation
import IACore
import IAOverTheCounter
#if canImport(IaSdkCore)
import IaSdkCore
#endif

@MainActor
@objc(IaSdkOtcImpl)
public class IaSdkOtcImpl: NSObject {
    @objc public static let shared = IaSdkOtcImpl()

    @objc private override init() {
        super.init()
    }

    @objc public func registerModule() {
        #if canImport(IaSdkCore)
        IaSdkCoreImpl.registerModule("overTheCounter")
        #endif
    }

    @objc(launchProductSearchRouteIOS)
    public func launchProductSearchRouteIOS() {
        DispatchQueue.main.async {
            IAProductSearchScreen().present()
        }
    }
}
