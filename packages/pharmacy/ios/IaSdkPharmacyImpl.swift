import Foundation
import IACore
import IAPharmacy
#if canImport(IaSdkCore)
import IaSdkCore
#endif

@MainActor
@objc(IaSdkPharmacyImpl)
public class IaSdkPharmacyImpl: NSObject {
    @objc public static let shared = IaSdkPharmacyImpl()

    @objc private override init() {
        super.init()
    }

    @objc public func registerModule() {
        #if canImport(IaSdkCore)
        IaSdkCoreImpl.registerModule("apofinder")
        #endif
    }

    @objc(launchPharmacyDetailsIOS)
    public func launchPharmacyDetailsIOS() {
        DispatchQueue.main.async {
            IAPharmacyScreen().present()
        }
    }

    @objc(setPharmacyIdIOS:)
    public func setPharmacyIdIOS(_ pharmacyId: String) {
        Task {
            do {
                guard let pharmacyIdInt = Int(pharmacyId) else {
                    print("Error: Invalid pharmacy ID format")
                    return
                }
                try await IASDK.Pharmacy.setPharmacyID(pharmacyIdInt)
            } catch {
                print("Error setting pharmacy ID: \(error)")
            }
        }
    }

    @objc(getPharmacyIdIOS:)
    public func getPharmacyIdIOS(
        completionHandler: @escaping (String?) -> Void
    ) {
        let pharmacyId = IASDK.Pharmacy.getPharmacyID()
        if let id = pharmacyId {
            completionHandler(String(id))
        } else {
            completionHandler(nil)
        }
    }
}
