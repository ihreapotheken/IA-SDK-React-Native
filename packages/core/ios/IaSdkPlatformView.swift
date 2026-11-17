import Foundation
import IACore
import SwiftUI
import UIKit

@objc public enum IaSdkPlatformComponentIdentifier: Int {
    case cartButton
    case productGrid
    case unknown

    static func fromViewTypeId(_ id: String?) -> IaSdkPlatformComponentIdentifier {
        switch id {
        case "cartButton": return .cartButton
        case "productGrid": return .productGrid
        default: return .unknown
        }
    }
}

private class SizeTrackingHostingController: UIHostingController<AnyView> {
    var onContentLayout: (() -> Void)?

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        onContentLayout?()
    }
}

@MainActor
@objc(IaSdkPlatformHostView)
public final class IaSdkPlatformHostView: UIView {
    @objc public var onSizeChange: (([String: Any]) -> Void)?

    @objc public var onComponentTap: (([String: Any]) -> Void)?

    /// Reports the back or close button of an embedded screen, and a pharmacy selected in an embedded Apofinder.
    @objc public var onScreenDismiss: (([String: Any]) -> Void)?

    @objc public var viewId: NSString? {
        didSet { rebuildContent() }
    }

    @objc public var componentParams: NSDictionary? {
        didSet { rebuildContent() }
    }

    private var hostingController: UIHostingController<AnyView>?
    private var lastReportedSize: CGSize = .zero
    private var gridHasContent: Bool = true

    /// The embedded SDK screen, and the view id and embed style it was built for. Screens fill the view and are
    /// added as a child of the nearest view controller, so they get safe area insets, appearance callbacks and trait
    /// changes, and SwiftUI can own their navigation controller.
    private var screenController: UIHostingController<AnyView>?
    private var screenKey: String?

    public override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        clipsToBounds = true
    }

    public required init?(coder: NSCoder) {
        fatalError("init(coder:) is not supported")
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        hostingController?.view.frame = bounds
        screenController?.view.frame = bounds
        DispatchQueue.main.async { [weak self] in
            self?.measureAndReport()
        }
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        updateScreenContainment()
    }

    private func rebuildContent() {
        if let screen = Self.screenIdentifier(viewId as String?) {
            removeHostingController()
            showScreen(screen)
            return
        }
        removeScreen()

        let identifier = IaSdkPlatformComponentIdentifier.fromViewTypeId(viewId as String?)
        guard identifier != .unknown else {
            removeHostingController()
            return
        }

        let rootView: AnyView
        switch identifier {
        case .cartButton:
            // Without a JS tap handler the SDK opens its cart, asking the navigation delegate first.
            let onTap: EmptyCallback? = componentParams?["hasTapHandler"] as? Bool == true
                ? { [weak self] in self?.onComponentTap?([:]) }
                : nil
            rootView = AnyView(IACartButton(onTap: onTap))
        case .productGrid:
            gridHasContent = true
            let hasContent = Binding<Bool>(
                get: { [weak self] in self?.gridHasContent ?? true },
                set: { [weak self] newValue in
                    guard let self = self else { return }
                    self.gridHasContent = newValue
                    if !newValue {
                        self.reportEmptyContent()
                    }
                }
            )
            rootView = AnyView(IAProductGrid(
                type: productGridType(from: componentParams),
                shouldShowLoading: (componentParams?["shouldShowLoading"] as? Bool) ?? true,
                hasContent: hasContent
            ))
        case .unknown:
            return
        }

        if let controller = hostingController {
            controller.rootView = rootView
        } else {
            let controller = SizeTrackingHostingController(rootView: rootView)
            controller.view.backgroundColor = .clear
            if #available(iOS 16.0, *) {
                controller.sizingOptions = [.intrinsicContentSize]
            }
            controller.onContentLayout = { [weak self] in
                self?.measureAndReport()
            }
            addSubview(controller.view)
            controller.view.frame = bounds
            hostingController = controller
        }
        lastReportedSize = .zero
        setNeedsLayout()
    }

    private func removeHostingController() {
        hostingController?.view.removeFromSuperview()
        hostingController = nil
    }

    // MARK: - Embedded screens

    /// SDK screens the view embeds, by their JS view id (`IaSdkScreenViewId`).
    private static func screenIdentifier(_ viewId: String?) -> IaSdkScreenIdentifier? {
        switch viewId {
        case "startScreen": .start
        case "searchScreen": .search
        case "cartScreen": .cart
        case "pharmacyScreen": .pharmacy
        case "apofinderScreen": .apofinder
        case "redeemPrescription": .redeemPrescription
        default: nil
        }
    }

    private func showScreen(_ identifier: IaSdkScreenIdentifier) {
        let embedStyle = componentParams?["embedStyle"] as? String
        // React Native sets the view id and the parameters separately, so the screen is only built again when either
        // of them changed.
        let key = "\(identifier.rawValue)|\(embedStyle ?? "")"
        guard key != screenKey else { return }
        removeScreen()

        // The SDK shows a back or close button for the embed style the app chose, and reports its tap so the app can
        // close the screen. Without an embed style it shows neither.
        let onDismiss: EmptyCallback = { [weak self] in
            self?.onScreenDismiss?([:])
        }
        // Apofinder leaves closing to its caller, so a selection is reported as a dismiss too. Closing it without a
        // selection goes through the SDK's close button.
        var screen = IaSdkScreens.makeScreen(
            identifier,
            isCancellable: true,
            focusesOnAppear: nil,
            onApofinderFinish: { pharmacy in
                guard pharmacy != nil else { return }
                onDismiss()
            }
        )
        switch embedStyle {
        case "navigation": screen.hostEmbedStyle = .navigation(onDismiss: onDismiss)
        case "presentation": screen.hostEmbedStyle = .presentation(onDismiss: onDismiss)
        default: break
        }

        let controller = UIHostingController(rootView: AnyView(screen))
        controller.view.frame = bounds
        controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        addSubview(controller.view)
        screenController = controller
        screenKey = key
        updateScreenContainment()
    }

    private func removeScreen() {
        guard let controller = screenController else { return }
        if controller.parent != nil {
            controller.willMove(toParent: nil)
            controller.removeFromParent()
        }
        controller.view.removeFromSuperview()
        screenController = nil
        screenKey = nil
    }

    /// Adds the screen's controller as a child of the nearest view controller while the view is in a window, and
    /// removes it otherwise.
    private func updateScreenContainment() {
        guard let controller = screenController else { return }
        if window != nil {
            guard controller.parent == nil, let parent = superview?.nearestViewController else { return }
            parent.addChild(controller)
            controller.didMove(toParent: parent)
        } else if controller.parent != nil {
            controller.willMove(toParent: nil)
            controller.removeFromParent()
        }
    }

    private func productGridType(from params: NSDictionary?) -> IAProductGridType {
        let pzn = params?["pzn"] as? String
        switch params?["type"] as? String {
        case "productsOfTheMonth":
            return .productsOfTheMonth(pznToExclude: pzn)
        case "productRecommendations":
            return .productRecommendations(pzn: pzn ?? "")
        case "customersAlsoBought":
            return .customersAlsoBought(pzn: pzn ?? "")
        case "custom":
            return .custom(title: params?["title"] as? String ?? "", pzns: params?["pzns"] as? [String] ?? [])
        default:
            return .currentOffers(pznToExclude: pzn)
        }
    }

    private func reportEmptyContent() {
        let width = bounds.width
        guard width > 0 else { return }
        let emptySize = CGSize(width: width, height: 0)
        guard emptySize != lastReportedSize else { return }
        lastReportedSize = emptySize
        onSizeChange?([
            "width": width,
            "height": CGFloat(0),
        ])
    }

    private func measureAndReport() {
        guard let hostingController else { return }
        guard gridHasContent else {
            reportEmptyContent()
            return
        }
        let width = bounds.width
        guard width > 0 else { return }
        let target = CGSize(width: width, height: .greatestFiniteMagnitude)
        let size = hostingController.sizeThatFits(in: target)
        guard size.width > 0, size.height >= 0 else { return }
        guard size != lastReportedSize else { return }
        lastReportedSize = size

        onSizeChange?([
            "width": size.width,
            "height": size.height,
        ])
    }
}

private extension UIResponder {
    /// This responder if it's a view controller, otherwise the first view controller up the responder chain.
    var nearestViewController: UIViewController? {
        var responder: UIResponder? = self
        while let current = responder {
            if let viewController = current as? UIViewController { return viewController }
            responder = current.next
        }
        return nil
    }
}
