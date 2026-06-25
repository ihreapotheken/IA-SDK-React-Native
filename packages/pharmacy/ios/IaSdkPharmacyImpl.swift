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
        // Appointment booking ships with the pharmacy experience. On iOS it is
        // part of the Integrations module / BEP configuration, so this is a
        // tracked no-op; on Android the pharmacy module registers the native
        // AppointmentsModule.
        IaSdkCoreImpl.registerModule("appointments")
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
