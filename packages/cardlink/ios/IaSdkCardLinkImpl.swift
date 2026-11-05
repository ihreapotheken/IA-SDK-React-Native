import Foundation
import SwiftUI
import UIKit
import IACore
import IACardLink
import IaSdkCore

// Event names matching TypeScript constants
private enum CardLinkEventName {
    static let consent = "CARDLINK_CONSENT_EVENT"
    static let sessionCreated = "CARDLINK_SESSION_CREATED"
    static let prescriptionsRedeemed = "CARDLINK_PRESCRIPTIONS_REDEEMED"
    static let event = "CARDLINK_EVENT"
    static let analytics = "CARDLINK_ANALYTICS_EVENT"
}

/// Values of `CardLinkEventName.event`.
private enum CardLinkEventType: String {
    case willExit = "willExitCardlink"
    case willStartScanning = "willStartScanning"
    case failedToInitialize = "failedToInitialize"
    case goToCart = "goToCart"
    case openTermsAndConditions = "openTermsAndConditions"
    case cardSaved = "cardSaved"
}

@MainActor
@objc(IaSdkCardLinkImpl)
public class IaSdkCardLinkImpl: NSObject {
    @objc public static let shared = IaSdkCardLinkImpl()

    @objc public nonisolated static let supportedEvents: [String] = [
        CardLinkEventName.consent,
        CardLinkEventName.sessionCreated,
        CardLinkEventName.prescriptionsRedeemed,
        CardLinkEventName.event,
        CardLinkEventName.analytics,
    ]

    private var eventEmitter: ((String, Any?) -> Void)?
    private var savedConfiguration: CardLinkConfiguration?
    private var savedSdkApiKey: String?
    /// SDK-wide palette from before a launch with colors, restored when CardLink closes.
    private var paletteBeforeLaunch: IAColorPalette?
    /// The palette the launch set. When the SDK replaced it meanwhile, with the remote theme of an initialization
    /// that finished, the SDK's palette is kept.
    private var paletteSetByLaunch: IAColorPalette?
    /// SDK-wide environment from before a launch with an environment, restored by a launch without one.
    private var environmentBeforeLaunch: EnvironmentID?
    /// The environment the launch set. When `iaSdk.initialize` set another one meanwhile, that one is kept.
    private var environmentSetByLaunch: EnvironmentID?
    /// Whether a CardLink flow launched from JS is shown, so its closing is reported once.
    private var isLaunchedFlowShown = false
    /// Whether the launched flow continues from the saved cards screen into the scan flow.
    private var isReopening = false
    private var observers: [NSObjectProtocol] = []

    @objc private override init() {
        super.init()
        let center = NotificationCenter.default
        // Actions of CardLink flows the SDK starts itself reach the core module's SDK delegate, which posts them.
        observers.append(center.addObserver(forName: IaSdkNotifications.cardLinkDidSendAction, object: nil, queue: .main) { notification in
            guard let action = notification.userInfo?["action"] as? CardLinkOutputAction else { return }
            Task { @MainActor in IaSdkCardLinkImpl.shared.handleSdkFlowOutputAction(action) }
        })
        observers.append(center.addObserver(forName: IaSdkNotifications.cardLinkDidCloseWithSdkScreens, object: nil, queue: .main) { _ in
            Task { @MainActor in
                Self.finishCardLink { IaSdkCardLinkImpl.shared.reportClosed() }
            }
        })
        observers.append(center.addObserver(forName: IaSdkNotifications.sdkEnvironmentWasSet, object: nil, queue: .main) { _ in
            Task { @MainActor in
                // Keeps the environment `iaSdk.initialize` set for launches without an environment.
                IaSdkCardLinkImpl.shared.environmentBeforeLaunch = nil
                IaSdkCardLinkImpl.shared.environmentSetByLaunch = nil
            }
        })
    }

    @objc public func setEventEmitter(_ emitter: @escaping (String, Any?) -> Void) {
        self.eventEmitter = emitter
    }

    @objc public func registerModule() {
        IaSdkCoreImpl.registerModule("cardLink")
    }

    // MARK: - Launch

    @objc(launch:resolve:reject:)
    public func launch(_ options: NSDictionary, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        guard let sdkApiKey = options["sdkApiKey"] as? String, !sdkApiKey.isEmpty else {
            reject("MISSING_API_KEY", "SDK API key is required")
            return
        }
        let configuration = Self.configuration(from: options)
        savedConfiguration = configuration
        savedSdkApiKey = sdkApiKey
        applyLaunchSettings(options)

        let flowType: CardlinkFlowType =
            options["flowType"] as? String == "launchCardLinkCards" ? .startSavedCards : .startCardlink

        guard let presentingViewController = Self.topPresentedViewController() else {
            restorePalette()
            reject("NO_VIEW_CONTROLLER", "Could not find root view controller")
            return
        }

        // Switches the SDK-wide environment, as CardLink follows it.
        if let environmentString = options["environment"] as? String {
            let environment: EnvironmentID = environmentString == "PRODUCTION" ? .prod : .staging
            if environmentBeforeLaunch == nil || IASDK.getEnvironment() != environmentSetByLaunch {
                environmentBeforeLaunch = IASDK.getEnvironment()
            }
            IASDK.setEnvironment(environment)
            environmentSetByLaunch = environment
        } else if let environmentBeforeLaunch {
            // The environment the SDK was initialized with, as on Android, unless initialize set it since.
            if IASDK.getEnvironment() == environmentSetByLaunch {
                IASDK.setEnvironment(environmentBeforeLaunch)
            }
            self.environmentBeforeLaunch = nil
            environmentSetByLaunch = nil
        }

        CardLink.legacyAuthenticationKey = .init(value: sdkApiKey)
        // Set before starting, as the SDK can report a failed start before `start` returns.
        isLaunchedFlowShown = true
        isReopening = false
        CardLink.start(
            type: flowType,
            forcePresent: false,
            on: presentingViewController,
            configuration: configuration,
            onOutputAction: { [weak self] action in
                self?.handleOutputAction(action)
            }
        )
        resolve(nil)
    }

    private static func configuration(from options: NSDictionary) -> CardLinkConfiguration {
        let consentStatus: CardLinkConsentStatus = switch options["consentStatus"] as? String {
        case "CONSENT_ACCEPTED": .accepted
        case "CONSENT_DECLINED": .declined
        default: .undetermined
        }
        let userId = options["userId"] as? String
        return CardLinkConfiguration(
            pharmacyId: options["pharmacyId"] as? String ?? "",
            consentStatus: consentStatus,
            canCode: options["canCode"] as? String,
            phoneNumber: options["phoneNumber"] as? String ?? "",
            userId: (userId?.isEmpty ?? true) ? "guest_user_id" : userId!,
            cardName: options["cardName"] as? String,
            isSaveCardEnabled: options["saveCardEnabled"] as? Bool ?? true,
            finishAction: options["finishAction"] as? String == "sendRawPrescriptions" ? .sendRawPrescriptions : .uploadPrescriptions
        )
    }

    /// Applies the launch options that are SDK-wide settings on iOS.
    private func applyLaunchSettings(_ options: NSDictionary) {
        if let supportsLiquidGlass = options["supportsLiquidGlass"] as? Bool {
            IASDK.configuration.uiConfiguration.supportsLiquidGlass = supportsLiquidGlass
        }
        if let logFilePath = options["coreAppLogFileURL"] as? String, !logFilePath.isEmpty {
            IASDK.configuration.hostAppLogFileURL = URL(fileURLWithPath: logFilePath)
        }
        if let sdkApiKey = options["sdkApiKey"] as? String, !sdkApiKey.isEmpty, IASDK.configuration.apiKey.isEmpty {
            IASDK.configuration.apiKey = sdkApiKey
        }
        if let appId = options["appId"] as? String, !appId.isEmpty {
            IASDK.configuration.appStoreID = appId
        }

        let primaryColor = Self.color(options["primaryColor"])
        let buttonsColor = Self.color(options["buttonsColor"])
        let textLinkColor = Self.color(options["textLinkColor"])
        let bottomNavigationColor = Self.color(options["bottomNavigationColor"])
        // CardLink uses the SDK-wide palette, so it's only replaced when colors are passed, and restored when CardLink
        // closes. Palette colors that aren't passed use the SDK defaults meanwhile.
        guard primaryColor != nil || buttonsColor != nil || textLinkColor != nil || bottomNavigationColor != nil else {
            return
        }
        if paletteBeforeLaunch == nil {
            paletteBeforeLaunch = Color.ia
        }
        let palette = IAColorPalette(
            primary: primaryColor.map { .init($0) },
            button: buttonsColor.map { .init($0) },
            link: textLinkColor.map { .init($0) },
            bottomNavigation: bottomNavigationColor.map { .init($0) }
        )
        Color.ia = palette
        paletteSetByLaunch = palette
    }

    private static func color(_ value: Any?) -> UIColor? {
        guard let number = value as? NSNumber else { return nil }
        let argb = number.int64Value
        return UIColor(
            red: CGFloat((argb >> 16) & 0xFF) / 255,
            green: CGFloat((argb >> 8) & 0xFF) / 255,
            blue: CGFloat(argb & 0xFF) / 255,
            alpha: CGFloat((argb >> 24) & 0xFF) / 255
        )
    }

    private func reopenCardLink() {
        guard let configuration = savedConfiguration, let apiKey = savedSdkApiKey else { return }
        CardLink.legacyAuthenticationKey = .init(value: apiKey)
        Self.finishCardLink { [weak self] in
            // Looked up after CardLink is dismissed, so it isn't CardLink's own view controller.
            guard let presentingViewController = Self.topPresentedViewController() else { return }
            self?.isLaunchedFlowShown = true
            // The saved cards screen has closed; a failed start of the scan flow then ends the launched flow.
            self?.isReopening = true
            CardLink.start(
                type: .startCardlink,
                forcePresent: false,
                on: presentingViewController,
                configuration: configuration,
                onOutputAction: { [weak self] action in
                    self?.handleOutputAction(action)
                }
            )
        }
    }

    /// Reports `willExit` for a closed launched flow, once, and restores the palette.
    private func reportClosed() {
        restorePalette()
        guard isLaunchedFlowShown else { return }
        isLaunchedFlowShown = false
        sendEvent(.willExit)
    }

    private func restorePalette() {
        guard let paletteBeforeLaunch else { return }
        if let paletteSetByLaunch, Self.isSamePalette(Color.ia, paletteSetByLaunch) {
            Color.ia = paletteBeforeLaunch
        }
        self.paletteBeforeLaunch = nil
        self.paletteSetByLaunch = nil
    }

    /// Compares the colors a launch sets, which tell its palette apart from the SDK's.
    private static func isSamePalette(_ palette: IAColorPalette, _ otherPalette: IAColorPalette) -> Bool {
        palette.primary == otherPalette.primary
            && palette.link == otherPalette.link
            && palette.bottomNavigation == otherPalette.bottomNavigation
    }

    /// The view controller CardLink is presented on: the top-most presented one, as a view controller that already
    /// presents one can't present another.
    private static func topPresentedViewController() -> UIViewController? {
        var viewController = keyWindowRootViewController()
        while let presented = viewController?.presentedViewController, !presented.isBeingDismissed {
            viewController = presented
        }
        return viewController
    }

    private static func keyWindowRootViewController() -> UIViewController? {
        UIApplication.shared.connectedScenes
            .compactMap { ($0 as? UIWindowScene)?.windows.first(where: \.isKeyWindow) }
            .first?
            .rootViewController
    }

    /// Whether a CardLink screen is presented or pushed.
    private static func isCardLinkShown() -> Bool {
        var viewController = keyWindowRootViewController()
        while let current = viewController {
            let stack = [current] + ((current as? UINavigationController)?.viewControllers ?? [])
            if stack.contains(where: { String(reflecting: type(of: $0)).hasPrefix("IACardLink.") }) {
                return true
            }
            viewController = current.presentedViewController
        }
        return false
    }

    /// The SDK only calls the completion of `CardLink.finish` after closing a shown CardLink, so it's called directly
    /// when none is shown.
    private static func finishCardLink(completion: @escaping () -> Void) {
        guard isCardLinkShown() else {
            CardLink.finish()
            completion()
            return
        }
        CardLink.finish(completion: completion)
    }

    // MARK: - Output actions

    /// Reports an action of a CardLink flow the SDK started itself, for example from the redeem prescription screen.
    /// The SDK closes and reopens those flows itself, so their closing isn't reported. It only closes CardLink for the
    /// cart and terms actions, so those are reported for the host to act on.
    func handleSdkFlowOutputAction(_ action: CardLinkOutputAction) {
        switch action {
        case .backButtonPressed, .reopenCardlink:
            break
        case .goToCart:
            sendEvent(.goToCart)
        case .openTermsAndConditions:
            sendEvent(.openTermsAndConditions)
        case .addedPrescriptionsToCart(let prescriptions):
            emit(CardLinkEventName.prescriptionsRedeemed, Self.prescriptionsJSON(prescriptions))
        default:
            handleOutputAction(action)
        }
    }

    private func handleOutputAction(_ action: CardLinkOutputAction) {
        switch action {
        case .consentAccepted(let phoneNumber):
            emit(CardLinkEventName.consent, ["status": "accepted", "phoneNumber": phoneNumber])
        case .consentDeclined:
            emit(CardLinkEventName.consent, ["status": "declined", "phoneNumber": NSNull()] as [String: Any])
        case .sessionCreated(let session):
            emit(CardLinkEventName.sessionCreated, [
                "cardSessionId": session.cardSessionId,
                "sessionExpireTimestamp": session.sessionExpiresAt,
            ] as [String: Any])
        case .backButtonPressed:
            Self.finishCardLink { [weak self] in
                self?.reportClosed()
            }
        case .prescriptionsRedeemed(let prescriptions):
            // The SDK sends .backButtonPressed next, which closes CardLink.
            emit(CardLinkEventName.prescriptionsRedeemed, prescriptions)
        case .goToCart:
            sendEvent(.goToCart)
        case .openTermsAndConditions:
            // The SDK has closed CardLink before this action, without .backButtonPressed.
            sendEvent(.openTermsAndConditions)
            reportClosed()
        case .cardsSaved(let cards):
            emit(CardLinkEventName.event, [
                "event": CardLinkEventType.cardSaved.rawValue,
                "cards": cards.map { card in
                    ["id": card.id, "name": card.name, "canNumber": card.canNumber, "phoneNumber": card.phoneNumber] as [String: Any]
                },
            ] as [String: Any])
        case .willStartScanning:
            sendEvent(.willStartScanning)
        case .failedToInitialize(let error):
            emit(CardLinkEventName.event, [
                "event": CardLinkEventType.failedToInitialize.rawValue,
                "errorMessage": "CardLink SDK failed to initialize: \(Self.reason(for: error))",
            ])
            if isReopening {
                // The saved cards screen that was shown has closed, like on Android.
                isReopening = false
                reportClosed()
            } else {
                // CardLink wasn't shown.
                isLaunchedFlowShown = false
                restorePalette()
            }
        case .trackEvent(let event):
            emit(CardLinkEventName.analytics, event)
        case .addedPrescriptionsToCart(let prescriptions):
            // With the uploadPrescriptions finish action the SDK closes CardLink itself and sends only this action.
            emit(CardLinkEventName.prescriptionsRedeemed, Self.prescriptionsJSON(prescriptions))
            reportClosed()
        case .reopenCardlink:
            reopenCardLink()
        @unknown default:
            break
        }
    }

    private static func reason(for error: CardLinkOutputAction.InitializationError) -> String {
        switch error {
        case .missingAuthenticationKey: "Missing authentication key."
        case .missingPharmacyID: "Missing pharmacy ID."
        case .failedToAuthenticate: "Failed to authenticate, please check your authentication key and bundle id."
        case .sdkNotInitialized: "The SDK isn't initialized."
        case .missingCardLinkEntitlement: "The API key isn't entitled to CardLink."
        @unknown default: "Unknown error"
        }
    }

    /// Prescriptions CardLink added to the cart itself, in the format of `.prescriptionsRedeemed`, which also
    /// includes a token the SDK doesn't pass here.
    private static func prescriptionsJSON(_ prescriptions: [EPrescriptionData]) -> String {
        struct AddedPrescription: Encodable {
            let taskId: String?
            let accessCode: String?
            let ePrescription: CardLinkEPrescription?
        }
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        let addedPrescriptions = prescriptions.map {
            AddedPrescription(taskId: $0.taskId, accessCode: $0.accessCode, ePrescription: $0.cardLinkEPrescription)
        }
        guard let data = try? encoder.encode(addedPrescriptions) else { return "[]" }
        return String(data: data, encoding: .utf8) ?? "[]"
    }

    private func sendEvent(_ event: CardLinkEventType) {
        emit(CardLinkEventName.event, ["event": event.rawValue])
    }

    private func emit(_ name: String, _ body: Any) {
        eventEmitter?(name, body)
    }

    // MARK: - Getters

    @objc(getVersionWithResolve:reject:)
    public func getVersion(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        resolve(CardLink.version)
    }

    @objc(getEnvironmentWithResolve:reject:)
    public func getEnvironment(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        switch IASDK.getEnvironment() {
        case .prod: resolve("PRODUCTION")
        case .dev, .staging: resolve("DEBUG")
        @unknown default: resolve("PRODUCTION")
        }
    }

    @objc(getLogFilePathWithResolve:reject:)
    public func getLogFilePath(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        // The SDK returns a file URL of an exported log copy, or "" when exporting fails.
        let logsPath = CardLink.logsPath
        resolve(logsPath.isEmpty ? nil : (URL(string: logsPath)?.path ?? logsPath))
    }

    // MARK: - Card management

    @objc(getSavedCards:resolve:reject:)
    public func getSavedCards(_ userId: String, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        // The SDK returns an empty list without saved cards and nil only when reading them failed.
        guard let cards = CardLink.getSavedCards(userId: userId) else {
            reject("GET_SAVED_CARDS_ERROR", "Reading the saved cards failed")
            return
        }
        do {
            let jsonData = try JSONEncoder().encode(cards)
            resolve(String(data: jsonData, encoding: .utf8) ?? "[]")
        } catch {
            reject("GET_SAVED_CARDS_ERROR", "Error encoding cards to JSON: \(error.localizedDescription)")
        }
    }

    @objc(deleteCard:cardName:resolve:reject:)
    public func deleteCard(_ userId: String, cardName: String, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        // The SDK reports a card that isn't saved like a storage failure, so that's checked first. Like on Android,
        // deleting it then does nothing.
        if let savedCards = CardLink.getSavedCards(userId: userId), !savedCards.contains(where: { $0.name == cardName }) {
            resolve(nil)
            return
        }
        do {
            try CardLink.deleteCard(userId: userId, name: cardName)
            resolve(nil)
        } catch {
            reject("DELETE_CARD_ERROR", "\(error)")
        }
    }

    @objc(deleteAllCardsWithResolve:reject:)
    public func deleteAllCards(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        do {
            let status = try CardLink.deleteAllCards()
            resolve("\(status)")
        } catch {
            reject("DELETE_ALL_CARDS_ERROR", "\(error)")
        }
    }

    @objc(deleteAllUserRelatedDataWithResolve:reject:)
    public func deleteAllUserRelatedData(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        Task { @MainActor in
            do {
                try await CardLink.deleteAllUserRelatedData()
                resolve(nil)
            } catch {
                reject("DELETE_ALL_USER_DATA_ERROR", "\(error)")
            }
        }
    }

    // MARK: - Other

    @objc(setHostAppLogFilePath:resolve:reject:)
    public func setHostAppLogFilePath(_ path: String, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IASDK.configuration.hostAppLogFileURL = path.isEmpty ? nil : URL(fileURLWithPath: path)
        resolve(nil)
    }

    @objc(setMocks:resolve:reject:)
    public func setMocks(_ options: NSDictionary, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        CardLink.setMocks(Self.mocks(from: options))
        resolve(nil)
    }

    private static func mocks(from options: NSDictionary) -> CardLinkMocks {
        var mocks = CardLinkMocks.default
        mocks.isMockingEnabled = options["isMockingEnabled"] as? Bool ?? true

        switch options["sessionResponse"] as? String {
        case "resumeSession": mocks.sessionMock.serverResponse = .resumeSession
        case "verificationNeeded": mocks.sessionMock.serverResponse = .verificationNeeded
        case "wrongPhoneNumber": mocks.sessionMock.serverResponse = .wrongPhoneNumber
        case "serviceNotAvailable": mocks.sessionMock.serverResponse = .serviceNotAvailable
        case "otherError": mocks.sessionMock.serverResponse = .otherError
        default: mocks.sessionMock.serverResponse = .auto
        }
        if let sessionDuration = (options["sessionDurationSeconds"] as? NSNumber)?.doubleValue {
            mocks.sessionMock.sessionDuration = sessionDuration
        }
        if let willExpireSoon = (options["sessionWillExpireSoonSeconds"] as? NSNumber)?.doubleValue {
            mocks.sessionMock.willExpireSoonTimeInterval = willExpireSoon
        }

        switch options["verificationResponse"] as? String {
        case "wrongOtp": mocks.verificationMock.serverResponse = .wrongOTP
        case "expiredOtp": mocks.verificationMock.serverResponse = .expiredOTP
        case "maxAttemptsReached": mocks.verificationMock.serverResponse = .maxAttemptsReached
        case "otherError": mocks.verificationMock.serverResponse = .otherError
        default: mocks.verificationMock.serverResponse = .success
        }

        if let xmls = options["ePrescriptionXmls"] as? [String] {
            let isPartial = options["arePrescriptionsPartiallyMocked"] as? Bool ?? false
            mocks.prescriptionsMock = .init(type: isPartial ? .partiallyEPrescriptionXML(xmls) : .ePrescriptionXML(xmls))
        } else {
            mocks.prescriptionsMock = .init(type: .noMock)
        }

        let isWrongCanMocked = options["isWrongCanMocked"] as? Bool ?? false
        mocks.scanMock = .init(type: isWrongCanMocked ? .wrongCan : .noMock)
        return mocks
    }

    @objc(finishWithResolve:reject:)
    public func finish(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        // Right after a launch CardLink signs in before it shows anything, and the SDK opens it afterwards anyway, so
        // its closing is only reported for a shown CardLink.
        let isShown = Self.isCardLinkShown()
        Self.finishCardLink { [weak self] in
            if isShown {
                self?.reportClosed()
            }
            resolve(nil)
        }
    }
}
