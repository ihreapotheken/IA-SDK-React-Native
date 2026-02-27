import Foundation
import UIKit
import IACore
import IACardLink
#if canImport(IaSdkCore)
import IaSdkCore
#endif

// Event names matching TypeScript constants
private enum CardLinkEventName {
    static let consent = "CARDLINK_CONSENT_EVENT"
    static let sessionCreated = "CARDLINK_SESSION_CREATED"
    static let prescriptionsRedeemed = "CARDLINK_PRESCRIPTIONS_REDEEMED"
    static let event = "CARDLINK_EVENT"
    static let analytics = "CARDLINK_ANALYTICS_EVENT"
}

@MainActor
@objc(IaSdkCardLinkImpl)
public class IaSdkCardLinkImpl: NSObject {
    @objc public static let shared = IaSdkCardLinkImpl()

    private var eventEmitter: ((String, Any?) -> Void)?
    private var savedConfiguration: CardLinkConfiguration?
    private var savedSdkApiKey: String?

    @objc private override init() {
        super.init()
    }

    @objc public func setEventEmitter(_ emitter: @escaping (String, Any?) -> Void) {
        print("[CardLink Swift] setEventEmitter called")
        self.eventEmitter = emitter
    }

    @objc public func registerModule() {
        #if canImport(IaSdkCore)
        IaSdkCoreImpl.registerModule("cardLink")
        #endif
    }

    // MARK: - Launch

    @objc public func launchIOS(
        sdkApiKey: String,
        flowType: String,
        pharmacyId: String,
        consentStatus: String,
        phoneNumber: String,
        userId: String,
        canCode: String?,
        cardName: String?,
        primaryColor: NSNumber?,
        buttonsColor: NSNumber?,
        textLinkColor: NSNumber?,
        bottomNavigationColor: NSNumber?,
        environment: String?,
        saveCardEnabled: NSNumber?,
        completionHandler: @escaping (String?) -> Void
    ) {
        // Setup style
        let style = CardLinkStyle(
            primaryColor: UIColor(argb: primaryColor?.intValue),
            buttonsColor: UIColor(argb: buttonsColor?.intValue),
            textLinkColor: UIColor(argb: textLinkColor?.intValue),
            bottomNavigationColor: UIColor(argb: bottomNavigationColor?.intValue)
        )
        CardLink.style = style

        // Set environment
        CardLink.environment = parseEnvironment(environment)

        // Create configuration
        let config = CardLinkConfiguration(
            pharmacyId: pharmacyId,
            consentStatus: parseConsentStatus(consentStatus),
            canCode: canCode,
            phoneNumber: phoneNumber,
            userId: userId.isEmpty ? "guest_user_id" : userId,
            cardName: cardName,
            isSaveCardEnabled: saveCardEnabled?.boolValue ?? false
        )

        self.savedConfiguration = config
        self.savedSdkApiKey = sdkApiKey

        // Get flow type
        let flowTypeEnum: CardlinkFlowType = flowType == "launchCardLinkCards" ? .startSavedCards : .startCardlink

        // Get root view controller
        guard let rootViewController = UIApplication.shared.windows.first(where: { $0.isKeyWindow })?.rootViewController else {
            completionHandler("Could not find root view controller")
            return
        }

        // Set authentication key and start
        CardLink.authenticationKey = .init(value: sdkApiKey)
        CardLink.start(
            type: flowTypeEnum,
            forcePresent: false,
            on: rootViewController,
            configuration: config,
            onOutputAction: { [weak self] action in
                self?.handleOutputAction(action)
            }
        )
        completionHandler(nil)
    }

    private func handleOutputAction(_ action: CardLinkOutputAction) {
        print("[CardLink Swift] handleOutputAction called: \(action)")
        switch action {
        case .consentAccepted(let phoneNumber):
            print("[CardLink Swift] Emitting consent accepted")
            eventEmitter?(CardLinkEventName.consent, "accepted")
        case .consentDeclined:
            print("[CardLink Swift] Emitting consent declined")
            eventEmitter?(CardLinkEventName.consent, "declined")
        case .sessionCreated(let session):
            print("[CardLink Swift] Emitting session created")
            let sessionDict: [String: Any] = [
                "cardSessionId": session.cardSessionId,
                "sessionExpireTimestamp": session.sessionExpiresAt
            ]
            eventEmitter?(CardLinkEventName.sessionCreated, sessionDict)
        case .backButtonPressed:
            print("[CardLink Swift] Emitting willExitCardlink")
            eventEmitter?(CardLinkEventName.event, "willExitCardlink")
            CardLink.finish()
        case .prescriptionsRedeemed(let prescriptions):
            print("[CardLink Swift] Emitting prescriptions redeemed")
            eventEmitter?(CardLinkEventName.prescriptionsRedeemed, prescriptions)
        case .goToCart:
            print("[CardLink Swift] Emitting goToCart")
            eventEmitter?(CardLinkEventName.event, "goToCart")
        case .openTermsAndConditions:
            print("[CardLink Swift] Emitting openTermsAndConditions")
            eventEmitter?(CardLinkEventName.event, "openTermsAndConditions")
        case .cardsSaved(let cards):
            print("[CardLink Swift] Emitting cardSaved")
            eventEmitter?(CardLinkEventName.event, "cardSaved")
        case .willStartScanning:
            print("[CardLink Swift] Emitting willStartScanning")
            eventEmitter?(CardLinkEventName.event, "willStartScanning")
        case .failedToInitialize(let error):
            print("[CardLink Swift] Emitting failedToInitialize")
            eventEmitter?(CardLinkEventName.event, "failedToInitialize")
        case .trackEvent(let event):
            print("[CardLink Swift] Emitting analytics event")
            eventEmitter?(CardLinkEventName.analytics, event)
        case .addedPrescriptionsToCart(_):
            break
        case .reopenCardlink:
            reopenCardLink()
        @unknown default:
            break
        }
    }

    private func reopenCardLink() {
        guard let config = savedConfiguration,
              let apiKey = savedSdkApiKey,
              let rootViewController = UIApplication.shared.windows.first(where: { $0.isKeyWindow })?.rootViewController else {
            return
        }

        CardLink.authenticationKey = .init(value: apiKey)
        CardLink.finish { [weak self] in
            CardLink.start(
                type: .startCardlink,
                forcePresent: false,
                on: rootViewController,
                configuration: config,
                onOutputAction: { [weak self] action in
                    self?.handleOutputAction(action)
                }
            )
        }
    }

    // MARK: - Getters

    @objc public func getVersionIOS(completionHandler: @escaping (String?) -> Void) {
        completionHandler(CardLink.version)
    }

    @objc public func getEnvironmentIOS(completionHandler: @escaping (String?) -> Void) {
        let env = CardLink.environment
        switch env {
        case .debugDEV, .debugQA:
            completionHandler("DEBUG")
        case .production:
            completionHandler("PRODUCTION")
        @unknown default:
            completionHandler("PRODUCTION")
        }
    }

    @objc public func getLogFilePathIOS(completionHandler: @escaping (String?) -> Void) {
        completionHandler(CardLink.logsPath)
    }

    // MARK: - Card Management

    @objc public func getSavedCardsIOS(userId: String, completionHandler: @escaping (String?) -> Void) {
        let cards = CardLink.getSavedCards(userId: userId)

        do {
            let jsonData = try JSONEncoder().encode(cards)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                completionHandler(jsonString)
            } else {
                completionHandler(nil)
            }
        } catch {
            completionHandler(nil)
        }
    }

    @objc public func deleteCardIOS(userId: String, cardName: String, completionHandler: @escaping (String?) -> Void) {
        do {
            try CardLink.deleteCard(userId: userId, name: cardName)
            completionHandler(nil)
        } catch {
            completionHandler(error.localizedDescription)
        }
    }

    @objc public func deleteAllCardsIOS(completionHandler: @escaping (String?) -> Void) {
        do {
            let status = try CardLink.deleteAllCards()
            completionHandler("\(status)")
        } catch {
            completionHandler(nil)
        }
    }

    @objc public func deleteAllUserRelatedDataIOS(completionHandler: @escaping (String?) -> Void) {
        Task {
            do {
                try await CardLink.deleteAllUserRelatedData()
                completionHandler(nil)
            } catch {
                completionHandler(error.localizedDescription)
            }
        }
    }

    // MARK: - Helpers

    private func parseConsentStatus(_ value: String) -> CardLinkConsentStatus {
        switch value {
        case "CONSENT_ACCEPTED":
            return .accepted
        case "CONSENT_DECLINED":
            return .declined
        default:
            return .undetermined
        }
    }

    private func parseEnvironment(_ value: String?) -> CLEnvironment {
        switch value {
        case "DEBUG":
            return .debugQA
        default:
            return .production
        }
    }

}

// MARK: - UIColor Extension

extension UIColor {
    convenience init?(argb hex: Int?) {
        guard let hex = hex else { return nil }

        let red = CGFloat((hex >> 16) & 0xFF) / 255.0
        let green = CGFloat((hex >> 8) & 0xFF) / 255.0
        let blue = CGFloat(hex & 0xFF) / 255.0
        let alpha = CGFloat((hex >> 24) & 0xFF) / 255.0
        self.init(red: red, green: green, blue: blue, alpha: alpha)
    }
}
