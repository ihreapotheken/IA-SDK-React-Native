import Foundation
import IACore
import IAOverTheCounter
import IaSdkCore

@MainActor
@objc(IaSdkOtcImpl)
public class IaSdkOtcImpl: NSObject {
    @objc public static let shared = IaSdkOtcImpl()

    @objc private override init() {
        super.init()
    }

    @objc public func registerModule() {
        IaSdkCoreImpl.registerModule("overTheCounter")
    }

    @objc(clearProductGridCacheWithResolve:reject:)
    public func clearProductGridCache(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IaSdkPromise.run("clearProductGridCache", resolve: resolve, reject: reject) {
            let overTheCounter = try IASDK.overTheCounter
            await overTheCounter.clearProductGridCache()
            return nil
        }
    }
}
