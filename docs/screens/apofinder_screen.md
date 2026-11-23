# Apofinder Screen

A screen that allows users to select a pharmacy by searching and filtering pharmacies, in a list or on a map.

Apofinder is part of the core package, `@ihreapotheken/ia-sdk-core`.

## Launch
```typescript
await iaSdk.launchApofinder({ isCancellable: true });
```

**Parameters**
  - **isCancellable**: When `false`, users cannot dismiss or go back, they must select a pharmacy. When `true`, a
    dismiss button is shown. Defaults to `true`.

The selected pharmacy is reported through `iaSdk.addApofinderPharmacyChangedListener`, see
[SDK Interaction](../interaction.md).

## Screen view
Apofinder presented over your app with `IaSdkScreenView`, in a stack navigator route with `presentation: 'modal'`.

```tsx
function ApofinderModal({ navigation }) {
  return (
    <IaSdkScreenView
      screen={IaSdkScreenViewId.ApofinderScreen}
      embedStyle={IaSdkScreenEmbedStyle.Presentation}
      // Called when the user selects a pharmacy or closes Apofinder.
      onDismiss={() => navigation.goBack()}
      style={{ flex: 1 }}
    />
  );
}
```

> [!NOTE]
> Read [Presentation](../presentation.md) in order to understand how IA SDK screens can be presented in your app.

## Platform differences
- **isCancellable:** Only used on iOS.
- **onDismiss:** Only used on iOS, where it's also called when the user selects a pharmacy.
- **addApofinderPharmacyChangedListener:** Not called for Apofinder shown as a screen view.
