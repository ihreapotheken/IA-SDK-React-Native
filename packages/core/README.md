# @ihreapotheken/ia-sdk-core

Core SDK functionality for the ia.de AppSDK React Native service.

## Implementation

For AppSDK usage, see the main [README.md](https://ihreapotheken.github.io/docs/appsdk/react-native) file.

API reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## Installation

```sh
# Configure the GitHub Package Registry in .npmrc:
# @ihreapotheken:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

npm install @ihreapotheken/ia-sdk-core@VERSION
```

## Usage

The core package provides the main SDK singleton and must be initialized before using any modules:

```typescript
import { iaSdk, ServerEnvironment } from '@ihreapotheken/ia-sdk-core';

// Register modules (from other packages)
await iaSdk.register([
  // Module instances...
]);

// Initialize the SDK
await iaSdk.initialize({
  accessKey: 'your-access-key',
  clientId: 'your-client-id',
  serverEnvironment: ServerEnvironment.Staging,
});
```

## Available Methods

Methods marked (iOS) or (Android) log a warning and do nothing on the other platform.
Failed calls reject with an `Error` whose `code` names the failure, e.g. `ARG_ERROR`,
`SDK_NOT_INITIALIZED` (Android) or `CLEAR_CART_ERROR`.

### Module Management

- `iaSdk.register(modules)` - Register module instances; call it once, before `initialize`
- `iaSdk.getModule<T>(type)` - Get a registered module by type
- `iaSdk.hasModule(type)` - Check if a module is registered

### SDK Operations

- `iaSdk.initialize(config)` - Initialize the SDK. Besides the credentials, `config` takes `footer`,
  `initialization` (indicator and prerequisites), `uiConfiguration` (colors, mascot, Liquid Glass),
  `qaConfiguration`, `cardLink`, `hostAppLogFilePath`, `appStoreId`/`playStoreId`,
  `isAnalyticsEnabled`, `isHapticFeedbackEnabled` and `isPickupLockerAndCourierShippingEnabled`
- `iaSdk.isInitialized()`, `iaSdk.getInitializationState()`, `iaSdk.getEnvironment()`
- `iaSdk.startDashboardActivity()`, `iaSdk.launchApofinder({ isCancellable })` - Launch SDK screens
- `iaSdk.finishAllActivities()` - Close the SDK screens
- `iaSdk.transferSDKv1UserData()` - Migrate SDK v1 user data, before `initialize`
- `iaSdk.legacySetupAsCoreApp()` - Setup for the ia.de Core app only (has an effect on iOS only)

### User Data

- `iaSdk.setGuestUserData(data)` - Set guest checkout information
- `iaSdk.setUserBillingAddress(address)` / `iaSdk.setUserDeliveryAddress(address)`
- `iaSdk.clearUserBillingAddress()` / `iaSdk.clearUserDeliveryAddress()`
- `iaSdk.logout()` - Reset user data, prerequisites, pharmacy and cart
- `iaSdk.deleteUser()` (iOS)

### Prerequisites

- `iaSdk.launchPrerequisiteFlow()` - Run legal documents, onboarding and pharmacy selection
- `iaSdk.isPrerequisiteFlowCompleted()`
- `iaSdk.resetPrerequisites()`, `iaSdk.resetAnalyticsConsent()`
- `iaSdk.resetLegalDisclaimer()` (iOS), `iaSdk.setIsOnboardingShown(value)` (iOS)

### Appearance, Debugging and Cache

- `iaSdk.setShouldShowMascotIllustrations(value)` (iOS), `iaSdk.setHapticFeedbackEnabled(value)` (Android)
- `iaSdk.presentLogs()`, `iaSdk.exportLogs()` (Android), `iaSdk.getUserId()` (iOS)
- `iaSdk.cleanCache(initialization, prerequisites)` (iOS), `iaSdk.removeAllCachedResponses()` (iOS)

### Callbacks and Listeners

```typescript
// Return false when the host app shows its own screen, true to let the SDK navigate.
iaSdk.onSdkWillNavigateToTarget = (target) => target !== IaSdkNavigationTarget.Cart;

// Android: return false to keep an SDK screen open on back.
iaSdk.onSdkBackAction = () => true;

const subscription = iaSdk.addInitializationStateListener((state) => {});
iaSdk.addAnalyticsEventListener(({ name, parameters }) => {});
iaSdk.addApofinderPharmacyChangedListener(({ pharmacyId, isFromPrerequisites }) => {});
iaSdk.addLogMessageListener(({ message, level }) => {}); // iOS
subscription.remove();
```

### Embedded Screens

SDK screens can be embedded in the app's own view hierarchy, for example in a tab or a
screen of the app's navigator, instead of being launched on top of the app:

```tsx
import {
  IaSdkScreenView,
  IaSdkScreenViewId,
  IaSdkScreenEmbedStyle,
} from '@ihreapotheken/ia-sdk-core';

function CartRoute({ navigation }) {
  return (
    <IaSdkScreenView
      screen={IaSdkScreenViewId.CartScreen}
      // iOS: the SDK shows a back (navigation) or close (presentation) button and reports its tap.
      embedStyle={IaSdkScreenEmbedStyle.Navigation}
      onDismiss={() => navigation.goBack()}
      style={{ flex: 1 }}
    />
  );
}
```

Available screens: `StartScreen`, `SearchScreen`, `CartScreen`, `PharmacyScreen`,
`ApofinderScreen` and `RedeemPrescription`. The screen fills the view and shows its own
navigation bar. On Android the SDK shows no back or close button; handle the back action
in the app. Pharmacies selected in an embedded Apofinder aren't reported through
`addApofinderPharmacyChangedListener`; on iOS the selection calls `onDismiss`.

## Re-exported Types

This package re-exports commonly used types from `@ihreapotheken/ia-sdk-interface`:

- `IaBaseModule`, `ServerEnvironment`, `Salutation` (enums)
- `IaModule`, `InitConfig`, `GuestUserData` (interfaces)
- Module interfaces for type-safe `getModule()` calls
