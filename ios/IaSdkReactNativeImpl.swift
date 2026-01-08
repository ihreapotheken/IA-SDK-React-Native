import Combine
import Foundation
import IACore
import IAIntegrations
import IAOrdering
import IAOverTheCounter

@MainActor
@objc(IaSdkReactNativeImpl)
public class IaSdkReactNativeImpl: NSObject {
    @objc public static let shared = IaSdkReactNativeImpl()

    @objc private override init() {
        super.init()
    }

    static var isRegistered: Bool = false

    @objc(initIaSdkIOS:clientId:serverEnvironmentId:completionHandler:)
    public func initIaSdkIOS(
        accessKey: String,
        clientId: String,
        serverEnvironmentId: String,
        completionHandler: @escaping (String?) -> Void,
    ) {
        IASDK.configuration.apiKey = accessKey
        IASDK.configuration.clientID = clientId
        let specifiedServerEnvironment: EnvironmentID
        switch serverEnvironmentId {
        case "development":
            specifiedServerEnvironment = EnvironmentID.dev
            break
        case "staging":
            specifiedServerEnvironment = EnvironmentID.staging
            break
        case "production":
            specifiedServerEnvironment = EnvironmentID.prod
            break
        default:
            fatalError("Invalid environment ID: \(serverEnvironmentId)")
        }
        IASDK.setEnvironment(specifiedServerEnvironment)
        if !Self.isRegistered {
            IASDK.register([
                .integrations,
                .overTheCounter,
                .ordering,
                .apofinder,
            ])
        }
        IASDK.setDelegate(
            IaClientDelegate(),
        )
        Task.init {
            do {
                let prerequisitesOptions = IASDKPrerequisitesOptions(
                    isCancellable: true,
                    isAnimated: true,
                    shouldRunLegal: true,
                    shouldRunOnboarding: false,
                    shouldRunApofinder: true,
                )
                let _ = try await IASDK.initialize(
                    options: .init(
                        shouldShowIndicator: false,
                        prerequisitesOptions: prerequisitesOptions
                    ),
                )
                completionHandler(nil)
            } catch {
                completionHandler("\(String(describing: error)) \(error.localizedDescription)")
            }
        }
    }

    /**
     * Configures the ia.de SDK.
     */
    @objc(configureIaSdkWithFooterShouldShowDataProcessing:)
    public func configureIaSdk(
        footerShouldShowDataProcessing: Bool,
    ) {
        IASDK.configuration.footer.shouldShowDataProcessing = footerShouldShowDataProcessing
    }

    /**
     * Forwards the client personal information to the ia.de library for checkout purposes.
     */
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
        completionHandler: @escaping (String?) -> Void,
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
                    email: email,
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
            IaClientViews.startScreen.iaScreen().present()
        }
    }

    @objc(logoutIOS:)
    public func logoutIOS(
        completionHandler: @escaping (String?) -> Void,
    ) {
        Task.init {
            do {
                try await IASDK.deleteAllUserRelatedData()
                completionHandler(nil)
            } catch {
                completionHandler("\(String(describing: error)) \(error.localizedDescription)")
            }
        }
    }

    @objc(clearCartIOS:)
    public func clearCartIOS(
        completionHandler: @escaping (String?) -> Void,
    ) {
        Task.init {
            do {
                try await IAOrderingSDK.deleteCart()
                completionHandler(nil)
            } catch {
                completionHandler("\(String(describing: error)) \(error.localizedDescription)")
            }
        }
    }

    @objc(transferPrescriptionsIOS:pdfs:codes:orderId:completionHandler:)
    public func transferPrescriptionsIOS(
        images: [String]? = nil,
        pdfs: [String]? = nil,
        codes: [String]? = nil,
        orderId: String? = nil,
        completionHandler: @escaping (String?) -> Void,
    ) {
        Task.init {
            do {
                try await IAOrderingSDK.deleteCart()
                let imageData: [Data]? = images?.compactMap { str in
                    Data(base64Encoded: str)
                }
                let pdfData: [PDFPrescription]? = pdfs?.compactMap { str in
                    guard let data = Data(base64Encoded: str) else { return nil }
                    return PDFPrescription(data: data)
                }
                try await IAOrderingSDK.transferPrescriptions(
                    images: imageData,
                    pdfs: pdfData,
                    codes: codes,
                    orderID: orderId,
                    finishAction: .noAction,
                )
                DispatchQueue.main.async {
                    IaClientViews.cartScreen.iaScreen().present()
                }
                completionHandler(nil)
            } catch {
                completionHandler("\(String(describing: error)) \(error.localizedDescription)")
            }
        }
    }

    /**
    * Order signature codes provided on successful checkout.
    */
    @objcMembers
    @objc(SignatureCodes)
    public class SignatureCodes: NSObject {
        var iaOrderCode: String
        var internalOrderCode: String

        public init(
            iaOrderCode: String,
            internalOrderCode: String
        ) {
            self.iaOrderCode = iaOrderCode
            self.internalOrderCode = internalOrderCode
        }
    }

    private var cancellable: Any?

    public func listenForSignatures(_ callback: @escaping (SignatureCodes?) -> Void) {
        cancellable = Self.orderSignatureListener.sink { value in
            callback(value)
        }
    }

    static public var orderSignatureListener = CurrentValueSubject<SignatureCodes?, Never>(nil)
}

class IaClientDelegate: SDKDelegate {
    func orderingWillShowThankYouScreen(orders: [IAOrder], dismissable: (any Dismissable)?)
        -> HandlingDecision
    {
        if let order = orders.first, let clientOrderID = order.clientOrderID {
            IaSdkReactNativeImpl.orderSignatureListener.value = IaSdkReactNativeImpl.SignatureCodes(
                iaOrderCode: order.orderCode,
                internalOrderCode: clientOrderID,
            )
            return .handled
        }
        return .performDefault
    }
}

/// Collection of views available for client display.
enum IaClientViews: CaseIterable {
    /**
     * Dashboard screen displaying main app content.
     */
    case startScreen

    /**
     * Cart screen displaying order overview.
     */
    case cartScreen

    /**
     * String identifier getter definition.
     */
    var name: String {
        return String(describing: self)
    }

    /**
     * Visual interface representation.
     */
    func iaScreen() -> any IAScreen {
        switch self {
        case IaClientViews.startScreen:
            IAStartScreen()

        case IaClientViews.cartScreen:
            IACartScreen()
        }
    }
}
