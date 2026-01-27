import Foundation
import IACore
import IACardLink
#if canImport(IaSdkCore)
import IaSdkCore
#endif

@MainActor
@objc(IaSdkCardLinkImpl)
public class IaSdkCardLinkImpl: NSObject {
    @objc public static let shared = IaSdkCardLinkImpl()

    @objc private override init() {
        super.init()
    }

    @objc public func registerModule() {
        #if canImport(IaSdkCore)
        IaSdkCoreImpl.registerModule("cardLink")
        #endif
    }
}
