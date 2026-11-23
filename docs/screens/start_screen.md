# Start Screen

Acts as the central hub for the IhreApotheken experience, giving users quick access to:
  * Pharmacy details
  * Search and filter products
  * Scan prescriptions
  * Recent orders
  * Cart
  * Product recommendations

The start screen is part of the core package, `@ihreapotheken/ia-sdk-core`. Some of its sections are shown only when
the module they need is registered, e.g. the cart button with `@ihreapotheken/ia-sdk-ordering`.

## Launch
```typescript
await iaSdk.startDashboardActivity();
```

## Screen view
The start screen embedded in a tab bar with `IaSdkScreenView`.

```tsx
<Tab.Navigator screenOptions={{ headerShown: false }}>
  <Tab.Screen name="Home">
    {() => <IaSdkScreenView screen={IaSdkScreenViewId.StartScreen} style={{ flex: 1 }} />}
  </Tab.Screen>
  {/* Your other tabs. */}
</Tab.Navigator>
```

> [!NOTE]
> Read [Presentation](../presentation.md) in order to understand how IA SDK screens can be presented in your app.
