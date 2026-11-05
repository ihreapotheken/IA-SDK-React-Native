import Foundation
import IACore
import IAPrescription
import IaSdkCore

/// Registers the prescription module. Its screens, scan callbacks and scanner camera go through the core module,
/// which owns the SDK delegate and screen presentation.
@MainActor
@objc(IaSdkPrescriptionImpl)
public class IaSdkPrescriptionImpl: NSObject {
    @objc public static let shared = IaSdkPrescriptionImpl()

    @objc private override init() {
        super.init()
    }

    @objc public func registerModule() {
        IaSdkCoreImpl.registerModule("prescription")
    }
}
