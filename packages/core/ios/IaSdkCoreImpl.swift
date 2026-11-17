import Combine
import Foundation
import IACore
import IAIntegrations
import IAOrdering
import IAOverTheCounter
import IAPharmacy
import IAPrescription
import IACardLink

public typealias IaResolveBlock = (Any?) -> Void
public typealias IaRejectBlock = (String, String) -> Void

/// Event names the core module emits. Must match `src/events.ts`.
enum IaSdkEvent {
    static let request = "IaSdkRequest"
    static let initializationStateChanged = "IaSdkInitializationStateChanged"
    static let apofinderPharmacyChanged = "IaSdkApofinderPharmacyChanged"
    static let analyticsEvent = "IaSdkAnalyticsEvent"
    static let logMessage = "IaSdkLogMessage"
    static let cartUpdated = "IaSdkCartUpdated"
    static let orderFinished = "IaSdkOrderFinished"
    static let scannerCameraError = "IaSdkScannerCameraError"

    static let all = [
        request, initializationStateChanged, apofinderPharmacyChanged, analyticsEvent, logMessage,
        cartUpdated, orderFinished, scannerCameraError,
    ]
}

/// Request types of `IaSdkEvent.request`. Must match `src/events.ts`.
enum IaSdkRequestType {
    static let navigation = "navigation"
    static let prescriptionPhotoScanned = "prescriptionPhotoScanned"
    static let ePrescriptionScanned = "ePrescriptionScanned"
}

/// Invalid arguments, reported with the `ARG_ERROR` code.
public struct IaArgumentError: Error, LocalizedError {
    public let message: String
    public var errorDescription: String? { message }

    public init(message: String) {
        self.message = message
    }
}

/// Settles React Native promises for the ia.de modules, with error codes naming the failed method.
@MainActor
public enum IaSdkPromise {
    /// Runs `body` on the main actor and resolves with its result. Rejects with `ARG_ERROR` for an
    /// `IaArgumentError`, and otherwise with a code naming `method`, for example `CLEAR_CART_ERROR`.
    public static func run(
        _ method: String,
        resolve: @escaping IaResolveBlock,
        reject: @escaping IaRejectBlock,
        _ body: @escaping @MainActor () async throws -> Any?
    ) {
        Task { @MainActor in
            do {
                resolve(try await body())
            } catch let error as IaArgumentError {
                reject("ARG_ERROR", error.message)
            } catch {
                reject(errorCode(for: method), describe(error))
            }
        }
    }

    /// The error code naming a failed method, for example `CLEAR_CART_ERROR` for `clearCart`.
    public static func errorCode(for method: String) -> String {
        switch method {
        case "initialize": return "INIT_ERROR"
        case "setPharmacyId": return "SET_PHARMACY_ERROR"
        case "transferPrescriptions": return "PRESCRIPTION_TRANSFER_ERROR"
        default:
            let snakeCase = method.replacingOccurrences(of: "([a-z0-9])([A-Z])", with: "$1_$2", options: .regularExpression)
            return snakeCase.uppercased() + "_ERROR"
        }
    }

    public static func describe(_ error: Error) -> String {
        let description = String(describing: error)
        let localized = error.localizedDescription
        return description == localized ? description : "\(localized) (\(description))"
    }
}

/// Notifications for the CardLink module, which depends on this one and not the other way around.
public enum IaSdkNotifications {
    /// Posted for actions of CardLink flows the SDK starts itself, with the `CardLinkOutputAction` under "action".
    public static let cardLinkDidSendAction = Notification.Name("de.ihreapotheken.sdk.reactnative.cardLinkDidSendAction")
    /// Posted when `initialize` set the SDK environment, which CardLink launches without an environment keep.
    public static let sdkEnvironmentWasSet = Notification.Name("de.ihreapotheken.sdk.reactnative.sdkEnvironmentWasSet")
    /// Posted when `finishAllActivities` closed a CardLink flow shown on top of an SDK screen.
    public static let cardLinkDidCloseWithSdkScreens = Notification.Name("de.ihreapotheken.sdk.reactnative.cardLinkDidCloseWithSdkScreens")
}

@MainActor
@objc(IaSdkCoreImpl)
public class IaSdkCoreImpl: NSObject {
    @objc public static let shared = IaSdkCoreImpl()

    @objc public nonisolated static let supportedEvents: [String] = IaSdkEvent.all

    /// Sends events to JS. Thread-safe; set by the native module.
    nonisolated(unsafe) private var eventEmitter: ((String, Any?) -> Void)?

    private let delegate = IaSdkDelegate()
    private var cancellables = Set<AnyCancellable>()
    private var enabledRequestTypes = Set<String>()
    private var pendingRequests: [String: ([String: Any]?) -> Void] = [:]
    private var requestCounter = 0

    /// Whether SDK log messages are sent to JS. Only on while JS listens, as the SDK logs a lot.
    var isLogMessageForwardingEnabled = false

    /// Tracks whether modules have been registered with the SDK.
    static var isRegistered: Bool = false

    /// Names of the registered modules. Always present: "integrations", plus the mandatory always-on features
    /// "apofinder" (pharmacy selection) and "appointments", which the core owns. ("appointments" maps to no separate
    /// IASDKModule on iOS — see buildRegisteredModules.)
    nonisolated(unsafe) private static var registeredModuleNames: Set<String> = ["integrations", "apofinder", "appointments"]

    @objc private override init() {
        super.init()
        IASDK.setDelegate(delegate)
        observeInitializationState()
        PrescriptionScannerCameraController.shared.onError = { [weak self] error in
            self?.emit(IaSdkEvent.scannerCameraError, ["message": error.localizedDescription])
        }
    }

    /// Register additional modules to be initialized with the SDK.
    @objc public static func registerModule(_ moduleType: String) {
        let validModules = ["ordering", "overTheCounter", "apofinder", "prescription", "cardLink", "pharmacyDetails", "appointments"]
        if validModules.contains(moduleType) {
            registeredModuleNames.insert(moduleType)
        }
    }

    /// Builds the IASDKModule list from the registered module names.
    private static func buildRegisteredModules() -> [IASDKModule] {
        registeredModuleNames.compactMap { name in
            switch name {
            case "integrations": .integrations
            case "apofinder": .apofinder
            case "ordering": .ordering
            case "overTheCounter": .overTheCounter
            case "prescription": .prescription
            case "cardLink": .cardLink
            case "pharmacyDetails": .pharmacy
            // Appointment booking is part of the Integrations module on iOS.
            default: nil
            }
        }
    }

    // MARK: - Events

    @objc(attachWithEmitter:)
    public func attach(emitter: @escaping (String, Any?) -> Void) {
        eventEmitter = emitter
    }

    nonisolated func emit(_ name: String, _ body: [String: Any]) {
        eventEmitter?(name, body)
    }

    private func observeInitializationState() {
        IASDK.initializationStatePublisher
            .map(\.rnName)
            .removeDuplicates()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] state in
                self?.emit(IaSdkEvent.initializationStateChanged, ["state": state])
            }
            .store(in: &cancellables)
    }

    // MARK: - Native-to-JS requests

    @objc(setRequestHandlerEnabled:enabled:)
    public func setRequestHandlerEnabled(_ type: String, enabled: Bool) {
        if enabled {
            enabledRequestTypes.insert(type)
        } else {
            enabledRequestTypes.remove(type)
        }
    }

    func isRequestHandlerEnabled(_ type: String) -> Bool {
        enabledRequestTypes.contains(type)
    }

    @objc(respondToRequest:response:)
    public func respondToRequest(_ requestId: String, response: NSDictionary?) {
        pendingRequests[requestId]?(response as? [String: Any])
    }

    /// Asks JS for a decision and returns its response, or `nil` when JS has no handler for `type` or doesn't
    /// answer within `timeout` seconds.
    func request(_ type: String, payload: [String: Any], timeout: TimeInterval) async -> [String: Any]? {
        guard isRequestHandlerEnabled(type), eventEmitter != nil else { return nil }
        requestCounter += 1
        let requestId = String(requestCounter)
        return await withCheckedContinuation { continuation in
            var isResumed = false
            let resume: ([String: Any]?) -> Void = { [weak self] response in
                guard !isResumed else { return }
                isResumed = true
                self?.pendingRequests[requestId] = nil
                continuation.resume(returning: response)
            }
            pendingRequests[requestId] = resume
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
                resume(nil)
            }
            emit(IaSdkEvent.request, ["requestId": requestId, "type": type, "payload": payload])
        }
    }

    // MARK: - Helpers

    private func perform(
        _ method: String,
        resolve: @escaping IaResolveBlock,
        reject: @escaping IaRejectBlock,
        _ body: @escaping @MainActor () async throws -> Any?
    ) {
        IaSdkPromise.run(method, resolve: resolve, reject: reject, body)
    }

    /// Waits until an initialization in progress finished. An SDK screen decides once, when it appears, whether to
    /// run the initialization and prerequisites; one that appears while the initialization runs would wait forever.
    private func waitForInitialization() async {
        guard Self.isInitializing(IASDK.initializationState) else { return }
        for await state in IASDK.initializationStatePublisher.values where !Self.isInitializing(state) {
            break
        }
    }

    /// Whether the initialization runs, as opposed to the prerequisites after a successful one.
    private static func isInitializing(_ state: IASDKInitializationState) -> Bool {
        guard state.isInProgress else { return false }
        if case .success = state.initializationResult { return false }
        return true
    }

    /// The SDK keeps the prerequisites result of the session, so without this changed prerequisites only apply after
    /// an app restart. Its own `clearAllData` does the same.
    private static func cleanPrerequisitesCache() {
        IASDK.cleanCache(initialization: false, prerequisites: true)
    }

    // MARK: - Initialization

    @objc(initialize:resolve:reject:)
    public func initializeSdk(_ config: NSDictionary, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("initialize", resolve: resolve, reject: reject) {
            let config = try IaSdkConfigurationArguments(config)
            // After a failed initialization, an SDK screen can run the initialization and prerequisites itself. The
            // SDK rejects another initialization meanwhile, so a retry waits until that's done.
            if IASDK.initializationState.isInProgress {
                for await state in IASDK.initializationStatePublisher.values where !state.isInProgress {
                    break
                }
            }

            if !Self.isRegistered {
                IASDK.register(Self.buildRegisteredModules())
                Self.isRegistered = true
            }
            IASDK.setDelegate(self.delegate)
            IaSdkDelegate.cardLinkConfiguration = config.cardLink

            IASDK.setEnvironment(config.serverEnvironment)
            NotificationCenter.default.post(name: IaSdkNotifications.sdkEnvironmentWasSet, object: nil)
            IASDK.configuration.apiKey = config.accessKey
            IASDK.configuration.clientID = config.clientId
            if let channelId = config.channelId {
                IASDK.configuration.channelID = channelId
            }
            IASDK.configuration.shouldLoadRemoteStyleConfiguration = config.shouldFetchThemeFromRemote
            IASDK.configuration.footer.shouldShowAppSettings = config.shouldShowAppSettings
            IASDK.configuration.footer.shouldShowImprint = config.shouldShowImprint
            IASDK.configuration.uiConfiguration = config.uiConfiguration
            if let isEnabled = config.isPickupLockerAndCourierShippingEnabled {
                IASDK.configuration.isPickupLockerAndCourierShippingEnabled = isEnabled
            }
            if let appStoreId = config.appStoreId {
                IASDK.configuration.appStoreID = appStoreId
            }
            if let hostAppLogFilePath = config.hostAppLogFilePath, !hostAppLogFilePath.isEmpty {
                IASDK.configuration.hostAppLogFileURL = URL(fileURLWithPath: hostAppLogFilePath)
            }
            if let qaFeatures = config.qaFeatures {
                IASDK.QA.setQAFeatures(qaFeatures)
            }

            // Auto initialization matches Android: the prerequisites run when an SDK screen is shown.
            IASDK.configuration.isAutoInitializationEnabled = true
            IASDK.configuration.defaultInitializationOptions = config.initializationOptions

            _ = try await IASDK.initialize(
                shouldShowIndicator: config.initializationOptions.shouldShowIndicator,
                prerequisitesOptions: nil
            )
            return nil
        }
    }

    // MARK: - User data

    @objc(logoutWithResolve:reject:)
    public func logout(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("logout", resolve: resolve, reject: reject) {
            try await IASDK.clearAllData()
            return nil
        }
    }

    @objc(setGuestUserData:resolve:reject:)
    public func setGuestUserData(_ data: NSDictionary, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("setGuestUserData", resolve: resolve, reject: reject) {
            try await IASDK.setUserData(try IaUserArguments.userData(from: data))
            return nil
        }
    }

    @objc(setUserBillingAddress:resolve:reject:)
    public func setUserBillingAddress(_ address: NSDictionary, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("setUserBillingAddress", resolve: resolve, reject: reject) {
            try await IASDK.setUserBillingAddress(try IaUserArguments.address(from: address))
            return nil
        }
    }

    @objc(setUserDeliveryAddress:resolve:reject:)
    public func setUserDeliveryAddress(_ address: NSDictionary, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("setUserDeliveryAddress", resolve: resolve, reject: reject) {
            try await IASDK.setUserDeliveryAddress(try IaUserArguments.address(from: address))
            return nil
        }
    }

    @objc(clearUserBillingAddressWithResolve:reject:)
    public func clearUserBillingAddress(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("clearUserBillingAddress", resolve: resolve, reject: reject) {
            try await IASDK.setUserBillingAddress(nil)
            return nil
        }
    }

    @objc(clearUserDeliveryAddressWithResolve:reject:)
    public func clearUserDeliveryAddress(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("clearUserDeliveryAddress", resolve: resolve, reject: reject) {
            try await IASDK.setUserDeliveryAddress(nil)
            return nil
        }
    }

    @objc(deleteUserWithResolve:reject:)
    public func deleteUser(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("deleteUser", resolve: resolve, reject: reject) {
            try await IASDK.deleteUser()
            return nil
        }
    }

    // MARK: - Screens

    @objc(launchScreen:options:resolve:reject:)
    public func launchScreen(_ screen: String, options: NSDictionary?, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("launchScreen", resolve: resolve, reject: reject) {
            guard let identifier = IaSdkScreenIdentifier(rawValue: screen) else {
                throw IaArgumentError(message: "Unknown screen: \(screen)")
            }
            await self.waitForInitialization()
            IaSdkScreens.present(
                identifier,
                isCancellable: options?["isCancellable"] as? Bool ?? true,
                focusesOnAppear: options?["focusesOnAppear"] as? Bool,
                onApofinderPharmacySelected: { pharmacy in
                    // Only the SDK's own Apofinder flow tells the delegate, so the selection is reported here, like
                    // Android's Apofinder result.
                    self.emit(IaSdkEvent.apofinderPharmacyChanged, [
                        "pharmacyId": String(pharmacy.id),
                        "isFromPrerequisites": false,
                    ])
                }
            )
            return nil
        }
    }

    @objc(finishAllActivitiesWithResolve:reject:)
    public func finishAllActivities(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("finishAllActivities", resolve: resolve, reject: reject) {
            IaSdkScreens.finishAll()
            return nil
        }
    }

    @objc(setPrescriptionScannerCameraState:resolve:reject:)
    public func setPrescriptionScannerCameraState(_ state: NSDictionary, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("setPrescriptionScannerCameraState", resolve: resolve, reject: reject) {
            let controller = PrescriptionScannerCameraController.shared
            if let isOn = state["isOn"] as? Bool {
                controller.state.isOn = isOn
            }
            if let isFlashlightOn = state["isFlashlightOn"] as? Bool {
                controller.state.isFlashlightOn = isFlashlightOn
            }
            if let isPreviewPaused = state["isPreviewPaused"] as? Bool {
                controller.state.isPreviewPaused = isPreviewPaused
            }
            return nil
        }
    }

    // MARK: - State

    @objc(transferSDKv1UserDataWithResolve:reject:)
    public func transferSDKv1UserData(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("transferSDKv1UserData", resolve: resolve, reject: reject) {
            await IASDK.transferSDKv1UserData()
            return nil
        }
    }

    @objc(isInitializedWithResolve:reject:)
    public func isInitialized(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        // Matches the initialization state events and Android: prerequisites don't affect it.
        resolve(IASDK.initializationState.rnName == "initialized")
    }

    @objc(getInitializationStateWithResolve:reject:)
    public func getInitializationState(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        resolve(IASDK.initializationState.rnName)
    }

    @objc(getEnvironmentWithResolve:reject:)
    public func getEnvironment(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        switch IASDK.getEnvironment() {
        case .dev: resolve("development")
        case .staging: resolve("staging")
        case .prod: resolve("production")
        @unknown default: resolve("production")
        }
    }

    @objc(cleanCache:prerequisites:resolve:reject:)
    public func cleanCache(_ initialization: Bool, prerequisites: Bool, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IASDK.cleanCache(initialization: initialization, prerequisites: prerequisites)
        resolve(nil)
    }

    @objc(setShouldShowMascotIllustrations:resolve:reject:)
    public func setShouldShowMascotIllustrations(_ value: Bool, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IASDK.configuration.uiConfiguration.shouldShowMascotIllustrations = value
        resolve(nil)
    }

    // MARK: - Prerequisites

    @objc(resetPrerequisitesWithResolve:reject:)
    public func resetPrerequisites(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("resetPrerequisites", resolve: resolve, reject: reject) {
            try await IASDK.Prerequisites.resetAllPrerequisites()
            Self.cleanPrerequisitesCache()
            return nil
        }
    }

    @objc(resetLegalDisclaimerWithResolve:reject:)
    public func resetLegalDisclaimer(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("resetLegalDisclaimer", resolve: resolve, reject: reject) {
            try await IASDK.Prerequisites.resetLegalDisclaimer()
            Self.cleanPrerequisitesCache()
            return nil
        }
    }

    @objc(resetAnalyticsConsentWithResolve:reject:)
    public func resetAnalyticsConsent(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("resetAnalyticsConsent", resolve: resolve, reject: reject) {
            await IASDK.Prerequisites.resetAnalyticsConsent()
            Self.cleanPrerequisitesCache()
            return nil
        }
    }

    @objc(setIsOnboardingShown:resolve:reject:)
    public func setIsOnboardingShown(_ value: Bool, resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("setIsOnboardingShown", resolve: resolve, reject: reject) {
            try await IASDK.Prerequisites.setIsOnboardingShown(value)
            Self.cleanPrerequisitesCache()
            return nil
        }
    }

    @objc(isPrerequisiteFlowCompletedWithResolve:reject:)
    public func isPrerequisiteFlowCompleted(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("isPrerequisiteFlowCompleted", resolve: resolve, reject: reject) {
            // Checks the prerequisites `launchPrerequisiteFlow` would run, so it's true when the flow wouldn't show
            // anything.
            let options = IASDK.configuration.defaultInitializationOptions.prerequisitesOptions
            let status = try await IASDK.Prerequisites.prerequisitesCompletionStatus(
                runOnboardingIfNeeded: options?.runOnboardingIfNeeded ?? false,
                runLegalIfNeeded: options?.runLegalIfNeeded ?? false
            )
            return status.areAllCompleted
        }
    }

    private var isPrerequisiteFlowRunning = false

    @objc(launchPrerequisiteFlowWithResolve:reject:)
    public func launchPrerequisiteFlow(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        guard !isPrerequisiteFlowRunning else {
            reject("PREREQUISITE_FLOW_IN_PROGRESS", "The prerequisites flow is already running.")
            return
        }
        isPrerequisiteFlowRunning = true
        perform("launchPrerequisiteFlow", resolve: resolve, reject: reject) {
            defer { self.isPrerequisiteFlowRunning = false }
            // Initializes the SDK again with the stored options. The SDK keeps the result of its initialization, so
            // this runs the prerequisites only, and returns their kept result when they're already completed.
            let result = try await IASDK.initialize(options: IASDK.configuration.defaultInitializationOptions)
            return ["isCancelled": result.prerequisitesResult?.isCancelled ?? false]
        }
    }

    @objc(legacySetupAsCoreAppWithResolve:reject:)
    public func legacySetupAsCoreApp(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        // Needed for problem reports.
        IASDK.register([.integrations])
        // Requests need the SDK configuration, which the Core app doesn't fetch, for their SSL setup.
        IASDK.configuration.legacyIsCoreApp = true
        resolve(nil)
    }

    // MARK: - Debugging

    @objc(presentLogsWithResolve:reject:)
    public func presentLogs(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IASDK.QA.presentLogs()
        resolve(nil)
    }

    @objc(getUserIdWithResolve:reject:)
    public func getUserId(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        perform("getUserId", resolve: resolve, reject: reject) {
            try await IASDK.QA.getUserID()
        }
    }

    @objc(removeAllCachedResponsesWithResolve:reject:)
    public func removeAllCachedResponses(resolve: @escaping IaResolveBlock, reject: @escaping IaRejectBlock) {
        IASDK.QA.removeAllCachedResponses()
        resolve(nil)
    }

    @objc(setLogMessageForwardingEnabled:)
    public func setLogMessageForwardingEnabled(_ enabled: Bool) {
        isLogMessageForwardingEnabled = enabled
    }
}

extension IASDKInitializationState {
    /// The initialization state as JS's `IaSdkInitializationState` names it, matching the Android SDK's states. It
    /// follows the initialization only, so prerequisites that run later don't make it flip back to initializing.
    var rnName: String {
        switch initializationResult {
        case .success: "initialized"
        // A retry keeps the earlier failure until it finishes.
        case .failure: isInProgress ? "initializing" : "error"
        case nil: isInProgress ? "initializing" : "uninitialized"
        }
    }
}
