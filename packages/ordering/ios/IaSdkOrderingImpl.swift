import Foundation
import IACore
import IAOrdering
import IaSdkCore

@MainActor
@objc(IaSdkOrderingImpl)
public class IaSdkOrderingImpl: NSObject {
    @objc public static let shared = IaSdkOrderingImpl()

    @objc private override init() {
        super.init()
    }

    /// Register the ordering module with the core SDK, before its initialization.
    @objc public func registerModule() {
        IaSdkCoreImpl.registerModule("ordering")
    }

    @objc(clearCartWithResolve:reject:)
    public func clearCart(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IaSdkPromise.run("clearCart", resolve: resolve, reject: reject) {
            try await IASDK.ordering.deleteCart()
            return nil
        }
    }

    @objc(transferPrescriptions:resolve:reject:)
    public func transferPrescriptions(_ params: NSDictionary, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IaSdkPromise.run("transferPrescriptions", resolve: resolve, reject: reject) {
            let images = try (params["images"] as? [String] ?? []).map { try Self.decodeBase64($0, field: "images") }
            let pdfs = try (params["pdfs"] as? [[String: Any]] ?? []).map { pdf in
                guard let base64 = pdf["data"] as? String else {
                    throw IaArgumentError(message: "Each PDF needs base64 data.")
                }
                let insuranceType: PrescriptionInsuranceType =
                    pdf["insuranceType"] as? String == "privateInsurance" ? .privateInsurance : .publicHealthcare
                return PDFPrescription(data: try Self.decodeBase64(base64, field: "pdfs"), insuranceType: insuranceType)
            }
            let finishAction: TransferPrescriptionsFinishAction = switch params["finishAction"] as? String {
            case "showBottomSheet": .showBottomSheet
            case "noAction": .noAction
            default: .openCart
            }
            try await IASDK.ordering.transferPrescriptions(
                images: images,
                pdfs: pdfs,
                codes: params["codes"] as? [String] ?? [],
                orderID: params["orderId"] as? String,
                showActivityIndicator: params["showActivityIndicator"] as? Bool ?? true,
                finishAction: finishAction
            )
            return nil
        }
    }

    @objc(getCartDetails:shouldEmitCartUpdate:resolve:reject:)
    public func getCartDetails(
        _ allowCached: Bool,
        shouldEmitCartUpdate: Bool,
        resolve: @escaping IaResolveBlock,
        reject: @escaping IaRejectBlock
    ) {
        IaSdkPromise.run("getCartDetails", resolve: resolve, reject: reject) {
            let cartDetails = try await IASDK.ordering.getCartDetails(
                allowCached: allowCached,
                throwIfNil: false,
                shouldEmit: shouldEmitCartUpdate
            )
            guard let cartDetails else { return nil }
            return [
                "totalAmountInCart": cartDetails.totalAmountInCart,
                "products": cartDetails.products.map { ["pzn": $0.pzn, "amount": $0.amount] as [String: Any] },
            ] as [String: Any]
        }
    }

    @objc(deleteOrderHistoryWithResolve:reject:)
    public func deleteOrderHistory(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IaSdkPromise.run("deleteOrderHistory", resolve: resolve, reject: reject) {
            try await IASDK.ordering.deleteOrderHistory()
            return nil
        }
    }

    /// Decodes base64, adding the padding JS encoders may leave out.
    private static func decodeBase64(_ string: String, field: String) throws -> Data {
        var base64 = string
        let remainder = base64.count % 4
        if remainder > 0 {
            base64 += String(repeating: "=", count: 4 - remainder)
        }
        guard let data = Data(base64Encoded: base64, options: .ignoreUnknownCharacters) else {
            throw IaArgumentError(message: "\(field) must contain base64 strings.")
        }
        return data
    }
}
