import Combine
import Foundation
import IACore
import IAIntegrations
import IAOrdering
import IAOverTheCounter
import IAPharmacy
import IAPrescription
import SwiftUI
import UIKit

/// Screens `launchScreen` presents. Must match `IaSdkScreens` in `src/events.ts`.
enum IaSdkScreenIdentifier: String {
    case start
    case apofinder
    case cart
    case search
    case pharmacy
    case redeemPrescription
    case prescriptionScanner
    case ePrescriptionScanner
}

@MainActor
enum IaSdkScreens {
    /// Screens presented through `launchScreen`.
    private static let presentedScreens = NSHashTable<UIViewController>.weakObjects()

    /// Modules whose screens `finishAll` closes. On Android CardLink isn't one of the SDK's activities, so a CardLink
    /// flow the host launched stays open there, and here too.
    private static let sdkModuleNames = ["IACore", "IAIntegrations", "IAOverTheCounter", "IAOrdering", "IAPharmacy", "IAPrescription"]

    /// The view controller of a launched screen, which its callbacks only know after it's presented.
    private final class PresentedScreen {
        weak var viewController: UIViewController?
    }

    static func present(
        _ identifier: IaSdkScreenIdentifier,
        isCancellable: Bool,
        focusesOnAppear: Bool?,
        onApofinderPharmacySelected: @escaping (Pharmacy) -> Void
    ) {
        if identifier == .prescriptionScanner || identifier == .ePrescriptionScanner {
            PrescriptionScannerCameraController.shared.reset()
        }
        let presentedScreen = PresentedScreen()
        let screen = makeScreen(
            identifier,
            isCancellable: isCancellable,
            focusesOnAppear: focusesOnAppear,
            onApofinderFinish: { pharmacy in
                presentedScreen.viewController?.presentingViewController?.dismiss(animated: true)
                if let pharmacy {
                    onApofinderPharmacySelected(pharmacy)
                }
            }
        )
        if let viewController = screen.present() {
            presentedScreen.viewController = viewController
            presentedScreens.add(viewController)
        }
    }

    /// The SDK screen for `identifier`. Also used by `IaSdkPlatformHostView` to embed screens.
    static func makeScreen(
        _ identifier: IaSdkScreenIdentifier,
        isCancellable: Bool,
        focusesOnAppear: Bool?,
        onApofinderFinish: @escaping (Pharmacy?) -> Void
    ) -> any IAScreen {
        switch identifier {
        case .start:
            return IAStartScreen()
        case .apofinder:
            // The screen reports the selection only here, and leaves closing it to the caller.
            return IAApofinderScreen(isCancellable: isCancellable, onFinish: onApofinderFinish)
        case .cart:
            return IACartScreen()
        case .search:
            if let focusesOnAppear {
                return IAProductSearchScreen().focusesOnAppear(focusesOnAppear)
            }
            return IAProductSearchScreen()
        case .pharmacy:
            return IAPharmacyScreen()
        case .redeemPrescription:
            return IARedeemPrescriptionScreen()
        case .prescriptionScanner:
            return CameraControlledPrescriptionScannerScreen(type: .prescription)
        case .ePrescriptionScanner:
            return CameraControlledPrescriptionScannerScreen(type: .ePrescription)
        }
    }

    /// Closes the SDK screens shown on top of the app. Dismissing the lowest SDK screen also closes everything
    /// presented above it, while the host's own screens below it stay open, like on Android.
    static func finishAll() {
        guard let sdkScreen = lowestPresentedSDKScreen() else { return }
        // A CardLink flow launched while an SDK screen was shown sits on that screen, so it closes too.
        let closesCardLink = containsCardLink(from: sdkScreen)
        sdkScreen.presentingViewController?.dismiss(animated: true) {
            if closesCardLink {
                NotificationCenter.default.post(name: IaSdkNotifications.cardLinkDidCloseWithSdkScreens, object: nil)
            }
        }
    }

    private static func containsCardLink(from viewController: UIViewController) -> Bool {
        var current: UIViewController? = viewController
        while let viewController = current {
            let stack = [viewController] + ((viewController as? UINavigationController)?.viewControllers ?? [])
            if stack.contains(where: { String(reflecting: type(of: $0)).hasPrefix("IACardLink.") }) {
                return true
            }
            current = viewController.presentedViewController
        }
        return false
    }

    private static func lowestPresentedSDKScreen() -> UIViewController? {
        var viewController = UIApplication.shared.rootViewController?.presentedViewController
        while let current = viewController {
            if isSDKScreen(current) { return current }
            viewController = current.presentedViewController
        }
        return nil
    }

    /// Screens the SDK presented itself are recognized by the module their controller or its root comes from.
    private static func isSDKScreen(_ viewController: UIViewController) -> Bool {
        if presentedScreens.contains(viewController) { return true }
        var candidates = [viewController]
        if let rootViewController = (viewController as? UINavigationController)?.viewControllers.first {
            candidates.append(rootViewController)
        }
        let typeNames = candidates.map { String(reflecting: type(of: $0)) }
        if typeNames.contains(where: { $0.contains("IACardLink.") }) { return false }
        return typeNames.contains { typeName in
            sdkModuleNames.contains { typeName.contains("\($0).") }
        }
    }
}

// MARK: - Prescription scanner camera

/// Camera state of the scanner opened with `launchScreen`, which JS changes through
/// `setPrescriptionScannerCameraState`.
@MainActor
final class PrescriptionScannerCameraController: ObservableObject {
    static let shared = PrescriptionScannerCameraController()

    @Published var state = IACameraState()

    var onError: ((any Error) -> Void)?

    func reset() {
        state = IACameraState()
    }
}

/// The SDK screen only takes the camera state as a SwiftUI binding, so this screen observes the controller and
/// passes its state down, re-rendering the scanner whenever JS changes it.
@MainActor
struct CameraControlledPrescriptionScannerScreen: IAScreen {
    private var scanner: IAPrescriptionScannerScreen
    private let controller: PrescriptionScannerCameraController

    init(type: IAPrescriptionScannerType) {
        self.scanner = IAPrescriptionScannerScreen(type: type)
        self.controller = PrescriptionScannerCameraController.shared
    }

    var routeIdentifier: IARouteIdentifier {
        scanner.routeIdentifier
    }

    var entitlements: [Entitlement] {
        scanner.entitlements
    }

    var hostEmbedStyle: IAEmbedStyle? {
        get { scanner.hostEmbedStyle }
        set { scanner.hostEmbedStyle = newValue }
    }

    func content(navigator: any Navigator) -> some View {
        CameraControlledScannerContent(scanner: scanner, controller: controller, navigator: navigator)
    }
}

@MainActor
private struct CameraControlledScannerContent: View {
    let scanner: IAPrescriptionScannerScreen
    @ObservedObject var controller: PrescriptionScannerCameraController
    let navigator: any Navigator

    var body: some View {
        scanner
            .cameraState($controller.state)
            .onCameraError { [controller] error in
                controller.onError?(error)
            }
            .content(navigator: navigator)
    }
}
