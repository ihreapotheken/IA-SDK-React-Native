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

    @objc public var viewId: NSString? {
        didSet { rebuildContent() }
    }

    @objc public var componentParams: NSDictionary? {
        didSet { rebuildContent() }
    }

    private var hostingController: UIHostingController<AnyView>?
    private var lastReportedSize: CGSize = .zero
    private var gridHasContent: Bool = true

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
        DispatchQueue.main.async { [weak self] in
            self?.measureAndReport()
        }
    }

    private func rebuildContent() {
        let identifier = IaSdkPlatformComponentIdentifier.fromViewTypeId(viewId as String?)
        guard identifier != .unknown else {
            removeHostingController()
            return
        }

        let rootView: AnyView
        switch identifier {
        case .cartButton:
            rootView = AnyView(IACartButton())
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

    private func productGridType(from params: NSDictionary?) -> IAProductGridType {
        let pzn = params?["pzn"] as? String
        switch params?["type"] as? String {
        case "productsOfTheMonth":
            return .productsOfTheMonth(pznToExclude: pzn)
        case "productRecommendations":
            return .productRecommendations(pzn: pzn ?? "")
        case "customersAlsoBought":
            return .customersAlsoBought(pzn: pzn ?? "")
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
