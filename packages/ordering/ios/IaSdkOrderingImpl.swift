import Foundation
import IACore
import IAOrdering
#if canImport(IaSdkCore)
import IaSdkCore
#endif

@MainActor
@objc(IaSdkOrderingImpl)
public class IaSdkOrderingImpl: NSObject {
    @objc public static let shared = IaSdkOrderingImpl()

    @objc private override init() {
        super.init()
    }

    /// Decodes a base64 string to Data, adding padding if necessary.
    /// Swift's Data(base64Encoded:) requires proper padding (length divisible by 4).
    private func decodeBase64(_ string: String) -> Data? {
        var base64 = string
        // Add padding if needed
        let remainder = base64.count % 4
        if remainder > 0 {
            base64 += String(repeating: "=", count: 4 - remainder)
        }
        return Data(base64Encoded: base64)
    }

    /// Register the ordering module with the core SDK.
    @objc public func registerModule() {
        print("[IaSdkOrdering] registerModule called")
        // Register ordering module type with the core package
        // This is called before SDK initialization
        #if canImport(IaSdkCore)
        print("[IaSdkOrdering] Calling IaSdkCoreImpl.registerModule('ordering')")
        IaSdkCoreImpl.registerModule("ordering")
        #else
        print("[IaSdkOrdering] WARNING: Cannot import IaSdkCore")
        #endif
    }

    @objc(clearCartIOS:)
    public func clearCartIOS(
        completionHandler: @escaping (String?) -> Void
    ) {
        Task.init {
            do {
                try await IASDK.ordering.deleteCart()
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
        completionHandler: @escaping (String?) -> Void
    ) {
        print("[IaSdkOrdering] transferPrescriptionsIOS called")
        print("[IaSdkOrdering] images count: \(images?.count ?? 0)")
        print("[IaSdkOrdering] pdfs count: \(pdfs?.count ?? 0)")
        print("[IaSdkOrdering] codes count: \(codes?.count ?? 0)")
        print("[IaSdkOrdering] orderId: \(orderId ?? "nil")")

        if let imgs = images {
            for (i, img) in imgs.enumerated() {
                print("[IaSdkOrdering] image[\(i)] length: \(img.count) chars")
            }
        }
        if let pdfArr = pdfs {
            for (i, pdf) in pdfArr.enumerated() {
                print("[IaSdkOrdering] pdf[\(i)] length: \(pdf.count) chars")
            }
        }
        if let codesArr = codes {
            for (i, code) in codesArr.enumerated() {
                print("[IaSdkOrdering] code[\(i)]: \(code)")
            }
        }

        Task.init {
            do {
                // Convert base64 strings to Data arrays (empty array if nil)
                // Using decodeBase64 to handle potentially unpadded base64 strings
                let imageData: [Data] = images?.compactMap { str in
                    let data = self.decodeBase64(str)
                    print("[IaSdkOrdering] Decoded image: \(data?.count ?? 0) bytes")
                    return data
                } ?? []
                let pdfData: [PDFPrescription] = pdfs?.compactMap { str in
                    guard let data = self.decodeBase64(str) else {
                        print("[IaSdkOrdering] Failed to decode PDF")
                        return nil
                    }
                    print("[IaSdkOrdering] Decoded PDF: \(data.count) bytes")
                    return PDFPrescription(data: data)
                } ?? []
                let codeData: [String] = codes ?? []

                print("[IaSdkOrdering] Final imageData count: \(imageData.count)")
                print("[IaSdkOrdering] Final pdfData count: \(pdfData.count)")
                print("[IaSdkOrdering] Final codeData count: \(codeData.count)")

                try await IASDK.ordering.transferPrescriptions(
                    images: imageData,
                    pdfs: pdfData,
                    codes: codeData,
                    orderID: orderId,
                    showActivityIndicator: true,
                    finishAction: .openCart
                )
                print("[IaSdkOrdering] Transfer completed successfully")
                completionHandler(nil)
            } catch {
                print("[IaSdkOrdering] Transfer error: \(error)")
                completionHandler("\(String(describing: error)) \(error.localizedDescription)")
            }
        }
    }

    @objc(launchCartScreenIOS)
    public func launchCartScreenIOS() {
        DispatchQueue.main.async {
            IACartScreen().present()
        }
    }
}
