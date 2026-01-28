# IA SDK React Native Example

Full example app demonstrating all modules of the ia.de AppSDK React Native integration.

## Overview

This example app showcases the complete SDK functionality including:

- SDK initialization and configuration
- Module registration pattern
- CardLink (NFC prescription transfer)
- Pharmacy details and selection
- Order management and checkout
- Prescription management
- OTC product browsing
- Guest user data management

## Prerequisites

- Node.js 20.x or later
- Yarn 4.x (managed via corepack)
- React Native development environment ([setup guide](https://reactnative.dev/docs/set-up-your-environment))
- Xcode 16.0+ (for iOS)
- Android Studio with SDK 30+ (for Android)

## Getting Started

### 1. Install Dependencies

From the repository root:

```sh
yarn install
```

### 2. Build the Packages

```sh
yarn build
```

### 3. Run the App

#### Android

```sh
cd example
yarn android
```

#### iOS

First, install CocoaPods dependencies:

```sh
cd example
bundle install
cd ios && bundle exec pod install && cd ..
```

Then run the app:

```sh
yarn ios
```

## Project Structure

```
example/
├── src/
│   └── App.tsx          # Main application with SDK integration
├── android/             # Android native project
│   ├── app/
│   │   └── build.gradle # App configuration
│   └── settings.gradle  # Project settings
├── ios/                 # iOS native project
│   ├── Podfile          # CocoaPods configuration
│   └── IaSdkReactNativeExample/
├── app.json             # React Native app configuration
├── metro.config.js      # Metro bundler configuration (monorepo)
└── babel.config.js      # Babel configuration
```

## SDK Integration Pattern

This example demonstrates the recommended SDK usage pattern:

### Module Registration

```typescript
import { iaSdk, ServerEnvironment } from '@ihreapotheken/ia-sdk-core';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';
import { IaModuleOrdering } from '@ihreapotheken/ia-sdk-ordering';
import { IaModulePrescription } from '@ihreapotheken/ia-sdk-prescription';
import { IaModuleOverTheCounter } from '@ihreapotheken/ia-sdk-over-the-counter';

// Register all modules before initialization
await iaSdk.register([
  new IaModuleCardLink(),
  new IaModulePharmacy(),
  new IaModuleOrdering(),
  new IaModulePrescription(),
  new IaModuleOverTheCounter(),
]);

// Initialize with credentials
await iaSdk.initialize({
  accessKey: ACCESS_KEY,
  clientId: CLIENT_ID,
  serverEnvironment: ServerEnvironment.Staging,
});
```

### Using Modules

```typescript
// Core functionality
await iaSdk.startDashboardActivity();
await iaSdk.logout();

// Module-specific functionality
const pharmacy = iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);
await pharmacy.launchPharmacyDetails();

const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
await ordering.launchCartScreen();
```

## Comparison with Flutter SDK

This React Native SDK follows the same architectural patterns as the [Flutter SDK](https://github.com/ihreapotheken/IA-SDK-Flutter):

| Concept | React Native | Flutter |
|---------|--------------|---------|
| Singleton | `iaSdk` | `IaSdk.instance` |
| Registration | `iaSdk.register([...])` | `IaSdk.instance.register(modules: [...])` |
| Initialization | `iaSdk.initialize({...})` | `IaSdk.instance.initialize(config: ...)` |
| Module Access | `iaSdk.getModule<T>(type)` | `IaSdk.instance.cardLink` |

## Troubleshooting

### Metro Bundler Issues

```sh
npx react-native start --reset-cache
```

### Android Build Issues

```sh
cd android && ./gradlew clean && cd ..
```

### iOS Pod Issues

```sh
cd ios && rm -rf Pods Podfile.lock && bundle exec pod install && cd ..
```

### Module Not Found

Ensure workspace packages are built:

```sh
# From repository root
yarn build
```

## Learn More

- [Main SDK Documentation](../README.md)
- [API Reference](https://ihreapotheken.github.io/docs/appsdk/react-native)
- [Flutter SDK](https://github.com/ihreapotheken/IA-SDK-Flutter)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
