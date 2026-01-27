import Combine
import Foundation
import IACore
import IAIntegrations
import IAOrdering
import IAOverTheCounter
import IAPharmacy
import IAPrescription
import IACardLink

@MainActor
@objc(IaSdkCoreImpl)
public class IaSdkCoreImpl: NSObject {
    @objc public static let shared = IaSdkCoreImpl()

    @objc private override init() {
        super.init()
    }

    /// Tracks whether modules have been registered with the SDK.
    static var isRegistered: Bool = false

    /// List of registered module type names for dynamic registration.
    /// We store strings to avoid main actor isolation issues with IASDKModule static properties.
    nonisolated(unsafe) private static var registeredModuleNames: Set<String> = ["integrations"]

    /// Register additional modules to be initialized with the SDK.
    @objc public static func registerModule(_ moduleType: String) {
        // Validate the module type
        let validModules = ["ordering", "overTheCounter", "apofinder", "prescription", "cardLink", "pharmacyDetails"]
        if validModules.contains(moduleType) {
            registeredModuleNames.insert(moduleType)
            print("[IaSdkCore] Registered module: \(moduleType)")
        }
    }

    /// Build the list of IASDKModule instances from registered module names.
    /// Must be called on the main actor.
    /// IACore in SDK 1.0.0-beta.4+ exports all IASDKModule types.
    private static func buildRegisteredModules() -> [IASDKModule] {
        var modules: [IASDKModule] = []

        for name in registeredModuleNames {
            switch name {
            case "integrations":
                modules.append(.integrations)
            case "apofinder":
                modules.append(.apofinder)
            case "ordering":
                modules.append(.ordering)
            case "overTheCounter":
                modules.append(.overTheCounter)
            case "prescription":
                modules.append(.prescription)
            case "cardLink":
                modules.append(.cardLink)
            case "pharmacyDetails":
                modules.append(.pharmacy)
            default:
                break
            }
        }

        print("[IaSdkCore] Building modules: \(modules)")
        return modules
    }

    @objc(initIaSdkIOS:clientId:serverEnvironmentId:completionHandler:)
    public func initIaSdkIOS(
        accessKey: String,
        clientId: String,
        serverEnvironmentId: String,
        completionHandler: @escaping (String?) -> Void
    ) {
        IASDK.configuration.apiKey = accessKey
        IASDK.configuration.clientID = clientId

        let specifiedServerEnvironment: EnvironmentID
        switch serverEnvironmentId {
        case "development":
            specifiedServerEnvironment = EnvironmentID.dev
        case "staging":
            specifiedServerEnvironment = EnvironmentID.staging
        case "production":
            specifiedServerEnvironment = EnvironmentID.prod
        default:
            fatalError("Invalid environment ID: \(serverEnvironmentId)")
        }
        IASDK.setEnvironment(specifiedServerEnvironment)

        if !Self.isRegistered {
            print("[IaSdkCore] Registering modules with IASDK. Registered names: \(Self.registeredModuleNames)")
            let modules = Self.buildRegisteredModules()
            print("[IaSdkCore] Calling IASDK.register with \(modules.count) modules")
            IASDK.register(modules)
            Self.isRegistered = true
            print("[IaSdkCore] IASDK.register completed")
        } else {
            print("[IaSdkCore] Modules already registered, skipping")
        }

        IASDK.setDelegate(IaCoreDelegate())

        // Configure prerequisites options
        let prerequisitesOptions = IASDKPrerequisitesOptions(
            isCancellable: true,
            isAnimated: true,
            shouldRunLegal: true,
            shouldRunOnboarding: false,
            shouldRunApofinder: true
        )
        let initializationOptions = IASDKInitializationOptions(
            shouldShowIndicator: false,
            prerequisitesOptions: prerequisitesOptions
        )

        // Enable auto-initialization to match Android behavior
        IASDK.configuration.isAutoInitializationEnabled = true
        IASDK.configuration.defaultInitializationOptions = initializationOptions

        Task.init {
            do {
                // Use new API: pass shouldShowIndicator and prerequisitesOptions directly
                // Prerequisites are nil here since isAutoInitializationEnabled is true
                try await IASDK.initialize(
                    shouldShowIndicator: false,
                    prerequisitesOptions: nil
                )
                completionHandler(nil)
            } catch {
                completionHandler("\(String(describing: error)) \(error.localizedDescription)")
            }
        }
    }

    @objc(
        setGuestUserDataIOS:firstName:lastName:email:phoneNumberCountryCode:
        phoneNumberWithoutCountryCode:completionHandler:
    )
    public func setGuestUserDataIOS(
        salutation: String,
        firstName: String,
        lastName: String,
        email: String,
        phoneNumberCountryCode: Int,
        phoneNumberWithoutCountryCode: Int,
        completionHandler: @escaping (String?) -> Void
    ) {
        let iaSalutation: IAUserSalutation
        switch salutation.lowercased() {
        case "herr":
            iaSalutation = IAUserSalutation.male
        case "frau":
            iaSalutation = IAUserSalutation.female
        case "keine angabe":
            iaSalutation = IAUserSalutation.notSpecified
        default:
            iaSalutation = IAUserSalutation.diverse
        }
        Task.init {
            do {
                let userData = IAUserData(
                    salutation: iaSalutation,
                    firstName: firstName,
                    lastName: lastName,
                    countryCode: String(phoneNumberCountryCode),
                    phoneNumber: String(phoneNumberWithoutCountryCode),
                    email: email
                )
                try await IASDK.setUserData(userData)
                completionHandler(nil)
            } catch {
                completionHandler("\(String(describing: error)) \(error.localizedDescription)")
            }
        }
    }

    @objc(startDashboardActivityIOS)
    public func startDashboardActivityIOS() {
        DispatchQueue.main.async {
            IAStartScreen().present()
        }
    }

    @objc(logoutIOS:)
    public func logoutIOS(
        completionHandler: @escaping (String?) -> Void
    ) {
        Task.init {
            do {
                try await IASDK.clearAllData()
                completionHandler(nil)
            } catch {
                completionHandler("\(String(describing: error)) \(error.localizedDescription)")
            }
        }
    }

    @objc(finishAllActivitiesIOS)
    public func finishAllActivitiesIOS() {
        // Dismiss any presented SDK view controllers
        DispatchQueue.main.async {
            if let rootVC = UIApplication.shared.keyWindow?.rootViewController {
                rootVC.dismiss(animated: true, completion: nil)
            }
        }
    }
}

/// Core SDK delegate for handling SDK events.
class IaCoreDelegate: SDKDelegate {
    // Core delegate implementation - can be extended by modules
}
