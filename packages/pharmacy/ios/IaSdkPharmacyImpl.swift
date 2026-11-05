import Foundation
import IACore
import IAPharmacy
import IaSdkCore

@MainActor
@objc(IaSdkPharmacyImpl)
public class IaSdkPharmacyImpl: NSObject {
    @objc public static let shared = IaSdkPharmacyImpl()

    @objc private override init() {
        super.init()
    }

    @objc public func registerModule() {
        IaSdkCoreImpl.registerModule("pharmacyDetails")
    }

    @objc(setPharmacyId:resolve:reject:)
    public func setPharmacyId(_ pharmacyId: String, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IaSdkPromise.run("setPharmacyId", resolve: resolve, reject: reject) {
            try await IASDK.Pharmacy.setPharmacyID(try Self.numericId(pharmacyId))
            return nil
        }
    }

    @objc(savePharmacyId:resolve:reject:)
    public func savePharmacyId(_ pharmacyId: String, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IaSdkPromise.run("savePharmacyId", resolve: resolve, reject: reject) {
            IASDK.Pharmacy.savePharmacyID(try Self.numericId(pharmacyId))
            return nil
        }
    }

    @objc(getPharmacyIdWithResolve:reject:)
    public func getPharmacyId(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        resolve(IASDK.Pharmacy.getPharmacyID().map { String($0) })
    }

    @objc(clearPharmacyIdWithResolve:reject:)
    public func clearPharmacyId(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IaSdkPromise.run("clearPharmacyId", resolve: resolve, reject: reject) {
            IASDK.Pharmacy.savePharmacyID(nil)
            // The SDK keeps the prerequisites result of the session, so without this the cleared pharmacy only
            // applies after an app restart.
            IASDK.cleanCache(initialization: false, prerequisites: true)
            // The cart belongs to the cleared pharmacy, and the Android SDK empties it too. Without the Ordering
            // module there's no cart.
            if let ordering = try? IASDK.ordering {
                try await ordering.deleteCart()
            }
            return nil
        }
    }

    @objc(getPharmacy:resolve:reject:)
    public func getPharmacy(_ allowCached: Bool, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IaSdkPromise.run("getPharmacy", resolve: resolve, reject: reject) {
            guard IASDK.Pharmacy.getPharmacyID() != nil else { return nil }
            return try await IASDK.Pharmacy.getPharmacy(allowCached: allowCached).rnMap
        }
    }

    private static func numericId(_ pharmacyId: String) throws -> Int {
        guard let id = Int(pharmacyId.trimmingCharacters(in: .whitespaces)) else {
            throw IaArgumentError(message: "Invalid pharmacyId \"\(pharmacyId)\". Expected a numeric pharmacy identifier.")
        }
        return id
    }
}
