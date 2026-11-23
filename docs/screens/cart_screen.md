# Cart Screen

Provides a complete, self-managed flow for cart, checkout, and payment. The screen is reactive and integrates seamlessly
with other modules: when a product is added to the cart elsewhere in the app, the cart screen automatically reflects
the update.

**Features**
* **Empty cart screen:** When the cart is empty it shows recommended products and products of the month. It allows
  users to add products and prescriptions.
* **Cart screen:** Overview of all products and prescriptions in the cart, including cost section.
* **Checkout screen:** Delivery and payment options, product overview, prescription overview, and the cost section.
* **PayPal payment:** In-app PayPal integration.
* **Thank You screen:** Overview of the order.

The cart screen is part of the `@ihreapotheken/ia-sdk-ordering` package.

## Launch
```typescript
const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
await ordering.launchCartScreen();
```

## Screen view
The cart screen embedded in a tab bar with `IaSdkScreenView`.

```tsx
<Tab.Navigator screenOptions={{ headerShown: false }}>
  <Tab.Screen name="Cart">
    {() => <IaSdkScreenView screen={IaSdkScreenViewId.CartScreen} style={{ flex: 1 }} />}
  </Tab.Screen>
  {/* Your other tabs. */}
</Tab.Navigator>
```

> [!TIP]
> If your app embeds the cart in a tab bar, you can switch to that tab instead of letting the SDK open a new cart
> screen. See [SDK Interaction](../interaction.md).

> [!NOTE]
> Read [Presentation](../presentation.md) in order to understand how IA SDK screens can be presented in your app.
