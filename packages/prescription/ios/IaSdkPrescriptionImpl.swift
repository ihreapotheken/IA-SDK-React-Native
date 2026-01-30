import Foundation
import IACore
import IAPrescription
#if canImport(IaSdkCore)
import IaSdkCore
#endif

@MainActor
@objc(IaSdkPrescriptionImpl)
public class IaSdkPrescriptionImpl: NSObject {
    @objc public static let shared = IaSdkPrescriptionImpl()

    @objc private override init() {
        super.init()
    }

    @objc public func registerModule() {
        #if canImport(IaSdkCore)
        IaSdkCoreImpl.registerModule("prescription")
        #endif
    }
}
