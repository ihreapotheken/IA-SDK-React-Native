import Foundation
import IACore

/// The SDK delegate, forwarding the SDK's callbacks to JS.
@MainActor
final class IaSdkDelegate: SDKDelegate {
    /// How long the SDK waits for the host's navigation decision before navigating itself.
    private static let navigationDecisionTimeout: TimeInterval = 5
    /// How long the SDK waits for the host's scan decision before continuing with its default handling.
    private static let scanDecisionTimeout: TimeInterval = 120

    /// Configuration for CardLink flows the SDK starts itself, set by `initialize`.
    static var cardLinkConfiguration: IaCardLinkConfigurationArguments?

    private var core: IaSdkCoreImpl { IaSdkCoreImpl.shared }

    func sdkWillNavigateToTarget(_ navigationTarget: IANavigationTarget, decisionHandler: @escaping (HandlingDecision) -> Void) {
        guard core.isRequestHandlerEnabled(IaSdkRequestType.navigation) else {
            decisionHandler(.performDefault)
            return
        }
        let target: String
        switch navigationTarget {
        case .cart: target = "cart"
        case .pharmacyDetails: target = "pharmacyDetails"
        case .thankYou: target = "thankYou"
        case .imprint: target = "imprint"
        case .apofinder: target = "apofinder"
        @unknown default:
            decisionHandler(.performDefault)
            return
        }
        Task { @MainActor in
            let response = await core.request(
                IaSdkRequestType.navigation,
                payload: ["navigationTarget": target],
                timeout: Self.navigationDecisionTimeout
            )
            decisionHandler(response?["handled"] as? Bool == true ? .handled : .performDefault)
        }
    }

    func apofinderDidChangePharmacy(_ pharmacy: Pharmacy, isFromPrerequisites: Bool) {
        core.emit(IaSdkEvent.apofinderPharmacyChanged, [
            "pharmacyId": String(pharmacy.id),
            "isFromPrerequisites": isFromPrerequisites,
        ])
    }

    func orderingDidFinishOrders(orders: [IAOrder]) {
        guard let orderCode = orders.first?.orderCode else { return }
        core.emit(IaSdkEvent.orderFinished, [
            "orderCode": orderCode,
            "orderCodes": orders.map(\.orderCode),
            "clientOrderIDs": orders.compactMap(\.clientOrderID),
        ])
    }

    func orderingDidUpdateCart(cartState: IACartState) {
        let products: Any = cartState.cartDetails.map { details in
            details.products.map { ["pzn": $0.pzn, "amount": $0.amount] as [String: Any] }
        } ?? NSNull()
        core.emit(IaSdkEvent.cartUpdated, [
            "totalAmountInCart": cartState.cartDetails?.totalAmountInCart ?? 0,
            "clientOrderIDs": cartState.clientOrderIDs,
            "totalProducts": NSNull(),
            "totalPrescriptions": NSNull(),
            "products": products,
        ])
    }

    func cardLinkWillStartWithConfiguration(configuration: CardLinkConfiguration) -> CardLinkConfiguration {
        Self.cardLinkConfiguration?.applied(to: configuration) ?? configuration
    }

    func cardLinkDidSendAction(action: CardLinkOutputAction) -> HandlingDecision {
        // The CardLink module reports the actions of SDK-started flows; it observes this notification, as this module
        // can't depend on it.
        NotificationCenter.default.post(
            name: IaSdkNotifications.cardLinkDidSendAction,
            object: nil,
            userInfo: ["action": action]
        )
        return .performDefault
    }

    func sdkDidLogMessage(_ message: String, level: IALogLevel) {
        guard core.isLogMessageForwardingEnabled else { return }
        core.emit(IaSdkEvent.logMessage, ["message": message, "level": Self.levelName(level)])
    }

    /// Stable names for the SDK's log levels, matching the docs of `IaSdkLogMessage.level`.
    private static func levelName(_ level: IALogLevel) -> String {
        switch level {
        case .debug: "debug"
        case .info: "info"
        case .warning: "warning"
        case .error: "error"
        case .userInteraction: "userInteraction"
        case .cameraError: "cameraError"
        case .httpClientInfo: "httpClientInfo"
        case .httpClientSuccess: "httpClientSuccess"
        case .httpClientError: "httpClientError"
        default: level.title
        }
    }

    func sdkDidLogAnalyticsEvent(_ event: IAAnalyticsEvent) {
        core.emit(IaSdkEvent.analyticsEvent, [
            "name": event.name,
            "parameters": event.parameters.mapValues(Self.bridgeValue),
        ])
    }

    /// The parameter value in a type React Native can send. Other values are sent as their description.
    private static func bridgeValue(_ value: Any) -> Any {
        switch value {
        case is String, is NSNumber, is NSNull:
            value
        case let array as [Any]:
            array.map(bridgeValue)
        case let dictionary as [String: Any]:
            dictionary.mapValues(bridgeValue)
        default:
            String(describing: value)
        }
    }

    func didScanPrescription(_ prescription: Data) async -> IAPrescriptionScanResult {
        await requestScanResult(
            type: IaSdkRequestType.prescriptionPhotoScanned,
            payload: ["imageData": prescription.base64EncodedString()]
        )
    }

    func didScanEPrescription(_ ePrescription: EPrescriptionData) async -> IAPrescriptionScanResult {
        await requestScanResult(
            type: IaSdkRequestType.ePrescriptionScanned,
            payload: ["rawCode": ePrescription.rawCode, "urls": ePrescription.urls]
        )
    }

    private func requestScanResult(type: String, payload: [String: Any]) async -> IAPrescriptionScanResult {
        let response = await core.request(type, payload: payload, timeout: Self.scanDecisionTimeout)
        switch response?["decision"] as? String {
        case "handled":
            return .handled
        case "error":
            return .error(message: response?["message"] as? String ?? "")
        default:
            return .performDefault
        }
    }
}
