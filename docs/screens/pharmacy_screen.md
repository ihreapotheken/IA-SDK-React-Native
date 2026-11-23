# Pharmacy Screen

Displays detailed information about the currently selected pharmacy.

The pharmacy screen is part of the `@ihreapotheken/ia-sdk-pharmacy` package.

## Launch
```typescript
const pharmacy = iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);
await pharmacy.launchPharmacyDetails();
```

## Screen view
The pharmacy screen embedded in a tab bar with `IaSdkScreenView`.

```tsx
<Tab.Navigator screenOptions={{ headerShown: false }}>
  <Tab.Screen name="Pharmacy">
    {() => <IaSdkScreenView screen={IaSdkScreenViewId.PharmacyScreen} style={{ flex: 1 }} />}
  </Tab.Screen>
  {/* Your other tabs. */}
</Tab.Navigator>
```

> [!NOTE]
> Read [Presentation](../presentation.md) in order to understand how IA SDK screens can be presented in your app.
