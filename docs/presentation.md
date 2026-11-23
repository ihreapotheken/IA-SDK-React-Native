# Presentation

SDK screens can be shown in two ways:
* **Launch methods (recommended):** the SDK opens the screen on top of your app and takes care of its navigation.
* **Screen views:** you put the screen into your own UI with `IaSdkScreenView`, and push, present or embed it yourself
  (e.g. in a tab bar).

**IMPORTANT:** Before doing any of this, make sure that `initialize` has completed. See
[Initialization](initialization.md).

## Launch methods (recommended)
Launch methods are the preferred way to show SDK screens. The native SDK shows the screen itself, so there is one
wrapper less between your app and the SDK (no React Native view), which means fewer problems with layout, gestures,
keyboard and navigation.

```typescript
// Start screen, from the core package.
await iaSdk.startDashboardActivity();

// Product search, from @ihreapotheken/ia-sdk-over-the-counter.
const overTheCounter = iaSdk.getModule<IaOverTheCounterModule>(IaBaseModule.OverTheCounter);
await overTheCounter.launchProductSearchRoute();

// Cart, from @ihreapotheken/ia-sdk-ordering.
const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
await ordering.launchCartScreen();
```

Available launch methods:

| Method | Package |
|---|---|
| `iaSdk.startDashboardActivity()` | `@ihreapotheken/ia-sdk-core` |
| `iaSdk.launchApofinder()` | `@ihreapotheken/ia-sdk-core` |
| `launchProductSearchRoute()` | `@ihreapotheken/ia-sdk-over-the-counter` |
| `launchCartScreen()` | `@ihreapotheken/ia-sdk-ordering` |
| `launchPharmacyDetails()` | `@ihreapotheken/ia-sdk-pharmacy` |
| `launchRedeemPrescriptionScreen()` | `@ihreapotheken/ia-sdk-prescription` |
| `launchPrescriptionScanner(type)` (iOS only) | `@ihreapotheken/ia-sdk-prescription` |
| `launch(...)` | `@ihreapotheken/ia-sdk-cardlink` |

The SDK handles the navigation of launched screens, including closing them. To close all SDK screens from your code,
call `iaSdk.finishAllActivities()`.

## Screen views
Use `IaSdkScreenView` when you need to control how the screen is shown: push it to your navigation, present it
yourself, or embed it into your UI. Pick the screen with `screen`:

| `screen` | Screen | Package |
|---|---|---|
| `IaSdkScreenViewId.StartScreen` | Start screen | `@ihreapotheken/ia-sdk-core` |
| `IaSdkScreenViewId.ApofinderScreen` | Apofinder | `@ihreapotheken/ia-sdk-core` |
| `IaSdkScreenViewId.SearchScreen` | Product search | `@ihreapotheken/ia-sdk-over-the-counter` |
| `IaSdkScreenViewId.CartScreen` | Cart | `@ihreapotheken/ia-sdk-ordering` |
| `IaSdkScreenViewId.PharmacyScreen` | Pharmacy details | `@ihreapotheken/ia-sdk-pharmacy` |
| `IaSdkScreenViewId.RedeemPrescription` | Redeem prescription | `@ihreapotheken/ia-sdk-prescription` |

Screens fill the space you give them, so give them a size, e.g. `style={{ flex: 1 }}`. Each screen is a native view;
the screen shows its own navigation bar and navigates within itself.

You can specify `embedStyle`, this determines if the SDK screen shows a back button
(`IaSdkScreenEmbedStyle.Navigation`), a close button (`IaSdkScreenEmbedStyle.Presentation`) or no button (not set) in
its navigation. When the user taps that button, `onDismiss` is called. Note that `embedStyle` doesn't actually push,
present or embed, you are responsible for that, as with any other view.

When the module of a screen isn't registered, or your backend configuration doesn't include its feature, the SDK
shows a screen saying that the feature isn't available.

The examples below use [React Navigation](https://reactnavigation.org), but any navigation library works the same way.

### Embed
```tsx
const Tab = createBottomTabNavigator();

function ExampleTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Search">
        {() => <IaSdkScreenView screen={IaSdkScreenViewId.SearchScreen} style={{ flex: 1 }} />}
      </Tab.Screen>
      <Tab.Screen name="Cart">
        {() => <IaSdkScreenView screen={IaSdkScreenViewId.CartScreen} style={{ flex: 1 }} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
```

### Push to navigation
```tsx
function ProductSearchRoute({ navigation }) {
  return (
    <IaSdkScreenView
      screen={IaSdkScreenViewId.SearchScreen}
      embedStyle={IaSdkScreenEmbedStyle.Navigation}
      onDismiss={() => navigation.goBack()}
      style={{ flex: 1 }}
    />
  );
}

// Registered in a stack navigator without a header, then:
navigation.navigate('ProductSearch');
```

### Present
```tsx
function ProductSearchModal({ navigation }) {
  return (
    <IaSdkScreenView
      screen={IaSdkScreenViewId.SearchScreen}
      embedStyle={IaSdkScreenEmbedStyle.Presentation}
      onDismiss={() => navigation.goBack()}
      style={{ flex: 1 }}
    />
  );
}

// Registered in a stack navigator with `presentation: 'modal'` and without a header, then:
navigation.navigate('ProductSearchModal');
```

## Platform differences
- **`embedStyle` and `onDismiss`:** Only used on iOS. On Android the screen shows no back or close button, and the
  system back action applies.
- **Options:** `launchApofinder({ isCancellable })` and `launchProductSearchRoute({ focusesOnAppear })` are only used on
  iOS.
- **Scanners:** The prescription scanners can't be shown as screen views. On iOS use `launchPrescriptionScanner`, on
  Android open them from the redeem prescription screen.
