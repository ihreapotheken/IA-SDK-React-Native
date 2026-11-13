import Foundation
import IACore
import SwiftUI

/// The `initialize` configuration JS sends, see `IaSdk.runInitialization`.
struct IaSdkConfigurationArguments {
    let accessKey: String
    let clientId: String
    let serverEnvironment: EnvironmentID
    let channelId: Int?
    let shouldFetchThemeFromRemote: Bool
    let shouldShowAppSettings: Bool
    let shouldShowImprint: Bool
    let initializationOptions: IASDKInitializationOptions
    let uiConfiguration: SDKConfiguration.UIConfiguration
    let isPickupLockerAndCourierShippingEnabled: Bool?
    let appStoreId: String?
    let hostAppLogFilePath: String?
    let qaFeatures: Set<QAFeature>?
    let cardLink: IaCardLinkConfigurationArguments?

    @MainActor
    init(_ config: NSDictionary) throws {
        guard let accessKey = config["accessKey"] as? String, !accessKey.trimmingCharacters(in: .whitespaces).isEmpty,
              let clientId = config["clientId"] as? String, !clientId.trimmingCharacters(in: .whitespaces).isEmpty
        else {
            throw IaArgumentError(message: "accessKey and clientId must not be empty.")
        }
        self.accessKey = accessKey
        self.clientId = clientId
        serverEnvironment = switch config["serverEnvironment"] as? String {
        case "development": .dev
        case "production": .prod
        default: .staging
        }
        channelId = try Self.int(config["channelId"], field: "channelId")
        shouldFetchThemeFromRemote = config["shouldFetchThemeFromRemote"] as? Bool ?? false

        let footer = config["footer"] as? [String: Any] ?? [:]
        shouldShowAppSettings = footer["shouldShowAppSettings"] as? Bool ?? true
        shouldShowImprint = footer["shouldShowImprint"] as? Bool ?? true

        let initialization = config["initialization"] as? [String: Any] ?? [:]
        let prerequisites = initialization["prerequisites"] as? [String: Any] ?? [:]
        initializationOptions = IASDKInitializationOptions(
            shouldShowIndicator: initialization["shouldShowIndicator"] as? Bool ?? false,
            prerequisitesOptions: IASDKPrerequisitesOptions(
                isCancellable: prerequisites["isCancellable"] as? Bool ?? true,
                isAnimated: prerequisites["isAnimated"] as? Bool ?? true,
                shouldRunLegal: prerequisites["runLegalIfNeeded"] as? Bool ?? true,
                shouldRunOnboarding: prerequisites["runOnboardingIfNeeded"] as? Bool ?? false,
                shouldRunApofinder: prerequisites["runApofinderIfNeeded"] as? Bool ?? true
            )
        )

        uiConfiguration = try Self.uiConfiguration(config["uiConfiguration"] as? [String: Any] ?? [:])
        isPickupLockerAndCourierShippingEnabled = config["isPickupLockerAndCourierShippingEnabled"] as? Bool
        appStoreId = config["appStoreId"] as? String
        hostAppLogFilePath = config["hostAppLogFilePath"] as? String

        if let qa = config["qaConfiguration"] as? [String: Any] {
            var features = Set((qa["features"] as? [String] ?? []).compactMap(Self.qaFeature(named:)))
            if qa["showTestPharmaciesInApofinder"] as? Bool == true {
                features.insert(.showTestPharmaciesOnApofinder)
            }
            qaFeatures = features
        } else {
            qaFeatures = nil
        }

        if let cardLink = config["cardLink"] as? [String: Any] {
            self.cardLink = IaCardLinkConfigurationArguments(
                isSaveCardEnabled: cardLink["isSaveCardEnabled"] as? Bool,
                userId: cardLink["userId"] as? String,
                phoneNumber: cardLink["phoneNumber"] as? String
            )
        } else {
            cardLink = nil
        }
    }

    /// A whole number, or `nil` for a missing value. NaN, infinite and fractional numbers are rejected.
    static func int(_ value: Any?, field: String) throws -> Int? {
        guard let number = value as? NSNumber else { return nil }
        guard let int = Int(exactly: number.doubleValue) else {
            throw IaArgumentError(message: "\(field) must be a whole number, got \(number).")
        }
        return int
    }

    static func finiteNumber(_ value: Any?, field: String) throws -> CGFloat? {
        guard let number = value as? NSNumber else { return nil }
        guard number.doubleValue.isFinite else {
            throw IaArgumentError(message: "\(field) must be a finite number.")
        }
        return CGFloat(number.doubleValue)
    }

    static func color(_ value: Any?, field: String) throws -> Color? {
        try int(value, field: field).map { Color(argb: $0) }
    }

    @MainActor
    private static func uiConfiguration(_ map: [String: Any]) throws -> SDKConfiguration.UIConfiguration {
        var config = SDKConfiguration.UIConfiguration()
        config.supportsLiquidGlass = map["supportsLiquidGlass"] as? Bool ?? false
        config.shouldShowMascotIllustrations = map["shouldShowMascotIllustrations"] as? Bool ?? true

        let header = map["header"] as? [String: Any] ?? [:]
        config.header.style = header["style"] as? String == "monotone" ? .monotone : .duotone
        config.header.primaryColor = try color(header["primaryColor"], field: "header.primaryColor")
        config.header.secondaryColor = try color(header["secondaryColor"], field: "header.secondaryColor")

        let primary = map["primaryButton"] as? [String: Any] ?? [:]
        config.primaryButton.backgroundColor = try color(primary["backgroundColor"], field: "primaryButton.backgroundColor")
        config.primaryButton.backgroundDisabledColor = try color(primary["backgroundDisabledColor"], field: "primaryButton.backgroundDisabledColor")
        config.primaryButton.textColor = try color(primary["textColor"], field: "primaryButton.textColor")
        config.primaryButton.textDisabledColor = try color(primary["textDisabledColor"], field: "primaryButton.textDisabledColor")
        config.primaryButton.borderColor = try color(primary["borderColor"], field: "primaryButton.borderColor")
        config.primaryButton.borderDisabledColor = try color(primary["borderDisabledColor"], field: "primaryButton.borderDisabledColor")
        config.primaryButton.borderWidth = try finiteNumber(primary["borderWidth"], field: "primaryButton.borderWidth")
        config.primaryButton.borderRadius = try finiteNumber(primary["borderRadius"], field: "primaryButton.borderRadius")

        let secondary = map["secondaryButton"] as? [String: Any] ?? [:]
        config.secondaryButton.backgroundColor = try color(secondary["backgroundColor"], field: "secondaryButton.backgroundColor")
        config.secondaryButton.backgroundDisabledColor = try color(secondary["backgroundDisabledColor"], field: "secondaryButton.backgroundDisabledColor")
        config.secondaryButton.textColor = try color(secondary["textColor"], field: "secondaryButton.textColor")
        config.secondaryButton.textDisabledColor = try color(secondary["textDisabledColor"], field: "secondaryButton.textDisabledColor")
        config.secondaryButton.borderColor = try color(secondary["borderColor"], field: "secondaryButton.borderColor")
        config.secondaryButton.borderDisabledColor = try color(secondary["borderDisabledColor"], field: "secondaryButton.borderDisabledColor")
        config.secondaryButton.borderWidth = try finiteNumber(secondary["borderWidth"], field: "secondaryButton.borderWidth")
        config.secondaryButton.borderRadius = try finiteNumber(secondary["borderRadius"], field: "secondaryButton.borderRadius")
        return config
    }

    private static func qaFeature(named name: String) -> QAFeature? {
        switch name {
        case "easyLogsAccessInProduction": .easyLogsAccessInProduction
        case "forceRefreshCartScreenButton": .forceRefreshCartScreenButton
        case "pharmacyPCasesInfoButton": .pharmacyPCasesInfoButton
        case "longPressProductInfo": .longPressProductInfo
        case "sdkInfoInNavigationBar": .sdkInfoInNavigationBar
        case "showInteractionWithRealPharmacyWarning": .showInteractionWithRealPharmacyWarning
        case "showPharmacyIdInputOnApofinder": .showPharmacyIDInputOnApofinder
        case "imageViewerDebugDetails": .imageViewerDebugDetails
        case "showFailedScannedCodeInErrorMessage": .showFailedScannedCodeInErrorMessage
        case "enableFirstResponderLogging": .enableIAFirstResponderLogging
        case "showLabTestActivationCodeDetails": .showLabTestActivationCodeDetails
        default: nil
        }
    }
}

/// Configuration for CardLink flows the SDK starts itself.
struct IaCardLinkConfigurationArguments {
    let isSaveCardEnabled: Bool?
    let userId: String?
    let phoneNumber: String?

    func applied(to configuration: CardLinkConfiguration) -> CardLinkConfiguration {
        var updated = configuration
        // userId can only be set through the initializer; the other values are changed in place, so the SDK's own
        // phone number isn't passed through the initializer's formatting again.
        if let userId, userId != configuration.userId {
            updated = CardLinkConfiguration(
                pharmacyId: configuration.pharmacyId,
                consentStatus: configuration.consentStatus,
                canCode: configuration.canCode,
                phoneNumber: configuration.phoneNumber,
                userId: userId,
                cardName: configuration.cardName,
                isSaveCardEnabled: configuration.isSaveCardEnabled,
                source: configuration.source,
                finishAction: configuration.finishAction
            )
        }
        // A saved card the user picked brings its own phone number, which its SMS code goes to.
        if let phoneNumber, configuration.canCode?.isEmpty ?? true {
            updated.setRawPhoneNumber(Self.formatted(phoneNumber: phoneNumber))
        }
        if let isSaveCardEnabled {
            updated.isSaveCardEnabled = isSaveCardEnabled
        }
        return updated
    }

    /// Formats the number like the `CardLinkConfiguration` initializer: only digits and a leading "+" are kept.
    private static func formatted(phoneNumber: String) -> String {
        let kept = phoneNumber.filter { $0.isNumber || $0 == "+" }
        guard let first = kept.first else { return kept }
        return String(first) + kept.dropFirst().filter { $0 != "+" }
    }
}

/// Guest user data and addresses JS sends.
enum IaUserArguments {
    /// Case-insensitive salutation. "Divers" is the Android label; unknown values are stored as "not specified",
    /// like on Android, instead of losing the user data.
    static func salutation(_ value: String?) -> IAUserSalutation? {
        guard let value else { return nil }
        switch value.trimmingCharacters(in: .whitespaces).lowercased() {
        case "herr": return .male
        case "frau": return .female
        case "divers", "diverse": return .diverse
        default: return .notSpecified
        }
    }

    static func userData(from map: NSDictionary) throws -> IAUserData {
        guard let firstName = map["firstName"] as? String,
              let lastName = map["lastName"] as? String,
              let email = map["email"] as? String
        else {
            throw IaArgumentError(message: "Missing or invalid firstName, lastName or email.")
        }
        // The SDK expects the country code with a leading "+", like its default "+49", and reads it back that way.
        let countryCode = (map["phoneNumberCountryCode"] as? String ?? "49").trimmingCharacters(in: .whitespaces)
        return IAUserData(
            salutation: salutation(map["salutation"] as? String) ?? .notSpecified,
            firstName: firstName,
            lastName: lastName,
            countryCode: countryCode.hasPrefix("+") ? countryCode : "+" + countryCode,
            phoneNumber: map["phoneNumberWithoutCountryCode"] as? String ?? "",
            email: email
        )
    }

    static func address(from map: NSDictionary) throws -> IAUserAddress {
        guard let firstName = map["firstName"] as? String,
              let lastName = map["lastName"] as? String,
              let street = map["street"] as? String,
              let houseNumber = map["houseNumber"] as? String,
              let zipCode = map["zipCode"] as? String,
              let city = map["city"] as? String
        else {
            throw IaArgumentError(
                message: "Missing or invalid argument types. Expected String values for firstName, lastName, street, houseNumber, zipCode and city."
            )
        }
        var phoneNumber: IAPhoneNumber?
        if let countryCode = try IaSdkConfigurationArguments.int(map["phoneNumberCountryCode"], field: "phoneNumberCountryCode"),
           let number = map["phoneNumberWithoutCountryCode"] as? String {
            phoneNumber = IAPhoneNumber(countryCode: countryCode, phoneNumber: number)
        }
        return IAUserAddress(
            firstName: firstName,
            lastName: lastName,
            additionalInfo: map["additionalInfo"] as? String,
            street: street,
            houseNumber: houseNumber,
            zipCode: zipCode,
            city: city,
            salutation: salutation(map["salutation"] as? String),
            phoneNumber: phoneNumber
        )
    }
}

extension Color {
    /// Creates a `Color` from an ARGB integer value (e.g. `0xFFRRGGBB`).
    init(argb value: Int) {
        let a = Double((value >> 24) & 0xFF) / 255.0
        let r = Double((value >> 16) & 0xFF) / 255.0
        let g = Double((value >> 8) & 0xFF) / 255.0
        let b = Double(value & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}
