# Prescription Scanner Screen

A camera screen for adding a prescription. Depending on the `type`, it lets the user:
- Take a photo of a paper prescription (or select one from the gallery)
- Scan the QR code of an electronic prescription (E-Prescription)

Use it when you already know how the user wants to add the prescription. To let the user choose the method, use the
[Redeem Prescription Screen](redeem_prescription_screen.md) instead.

The prescription is automatically added to the cart, which can be overridden with `onPrescriptionPhotoScanned` and
`onEPrescriptionScanned`, see [SDK Interaction](../interaction.md).

The prescription scanner is part of the `@ihreapotheken/ia-sdk-prescription` package.

## Launch
```typescript
const prescription = iaSdk.getModule<IaPrescriptionModule>(IaBaseModule.Prescription);
await prescription.launchPrescriptionScanner(IaPrescriptionScannerType.Prescription);
```

**Parameters**
  - **type**: `IaPrescriptionScannerType.Prescription` (capture photo) or `IaPrescriptionScannerType.EPrescription`
    (scan electronic prescription).

While the scanner is shown, you can control its camera with `setScannerCameraState`, and listen to camera errors with
`addScannerCameraErrorListener`:

```typescript
await prescription.setScannerCameraState({ isFlashlightOn: true });
```

The scanner can't be shown as a screen view.

> [!NOTE]
> Read [Presentation](../presentation.md) in order to understand how IA SDK screens can be presented in your app.

## Platform differences
- **Availability:** Only on iOS. On Android, open the scanners from the
  [Redeem Prescription Screen](redeem_prescription_screen.md).
