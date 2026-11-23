# Product Search Screen

This screen serves as a starting point for product search. It offers following features:
* **Search screen:** Search bar with list of products, allows filtering and sorting.
* **Product details:** Displays details of a selected product.
* **Product inquiry:** Enables the user to send an email to pharmacies and inquire about the product.
* **Cart integration:** The cart is integrated into the list and details if `@ihreapotheken/ia-sdk-ordering` is
  registered.
* **Product scanner:** Users can simply scan the product instead of searching it.

The product search screen is part of the `@ihreapotheken/ia-sdk-over-the-counter` package.

## Launch
```typescript
const overTheCounter = iaSdk.getModule<IaOverTheCounterModule>(IaBaseModule.OverTheCounter);
await overTheCounter.launchProductSearchRoute({ focusesOnAppear: true });
```

**Parameters**
  - **focusesOnAppear**: Whether the search field is focused when the screen opens. When not set, the SDK default is
    used.

## Screen view
The product search screen embedded in a tab bar with `IaSdkScreenView`.

```tsx
<Tab.Navigator screenOptions={{ headerShown: false }}>
  <Tab.Screen name="Search">
    {() => <IaSdkScreenView screen={IaSdkScreenViewId.SearchScreen} style={{ flex: 1 }} />}
  </Tab.Screen>
  {/* Your other tabs. */}
</Tab.Navigator>
```

> [!NOTE]
> Read [Presentation](../presentation.md) in order to understand how IA SDK screens can be presented in your app.

## Platform differences
- **focusesOnAppear:** Only used on iOS.
