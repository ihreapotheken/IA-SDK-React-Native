# Redeem Prescription Screen

Screen for redeeming prescriptions and adding them to the cart. It isn't a camera screen: it shows a list of the
methods for redeeming a prescription, and the user chooses one of them:
- CardLink (requires `@ihreapotheken/ia-sdk-cardlink`): read the electronic health card via NFC.
- Photo capture: take a photo of a prescription or choose one from the gallery.
- QR code scanning: scan a prescription QR code.

Choosing photo capture or QR code scanning opens the [Prescription Scanner Screen](prescription_scanner_screen.md).
Methods that aren't available are hidden. Prescriptions are uploaded to the cart only if
`@ihreapotheken/ia-sdk-ordering` is registered.

Your app can use the following to override the default behavior, see [SDK Interaction](../interaction.md):
  - `onPrescriptionPhotoScanned` and `onEPrescriptionScanned`: Get the prescription data instead of uploading it to
    the cart, e.g. if you are not using `@ihreapotheken/ia-sdk-ordering`.
  - `onSdkWillNavigateToTarget`: After a prescription is uploaded, the user can go to the cart. You can override it to
    show the cart inside your own UI, otherwise the cart is shown above everything.

The redeem prescription screen is part of the `@ihreapotheken/ia-sdk-prescription` package.

## Launch
```typescript
const prescription = iaSdk.getModule<IaPrescriptionModule>(IaBaseModule.Prescription);
await prescription.launchRedeemPrescriptionScreen();
```

## Screen view
The redeem prescription screen embedded in a tab bar with `IaSdkScreenView`.

```tsx
<Tab.Navigator screenOptions={{ headerShown: false }}>
  <Tab.Screen name="Prescriptions">
    {() => <IaSdkScreenView screen={IaSdkScreenViewId.RedeemPrescription} style={{ flex: 1 }} />}
  </Tab.Screen>
  {/* Your other tabs. */}
</Tab.Navigator>
```

> [!NOTE]
> Read [Presentation](../presentation.md) in order to understand how IA SDK screens can be presented in your app.
