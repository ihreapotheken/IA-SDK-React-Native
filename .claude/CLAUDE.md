# IA SDK React Native - Claude Agents Guide

## Project Overview

This is a React Native SDK monorepo for the Ihre Apotheken (ia.de) pharmacy services. The SDK provides modular packages that can be individually imported to reduce app size.

## Repository Structure

```
├── packages/           # SDK modules
│   ├── core/          # Core SDK functionality (required)
│   ├── interface/     # Shared TypeScript interfaces
│   ├── cardlink/      # NFC prescription transfer (CardLink)
│   ├── pharmacy/      # Pharmacy details and management
│   ├── ordering/      # Order management and checkout
│   ├── over-the-counter/ # OTC product browsing
│   └── prescription/  # Prescription management
├── example/           # Full example app with all modules (workspace)
└── test/              # Minimal example apps
    ├── cardlink-demo/              # CardLink only (published packages)
    ├── cardlink-example/           # CardLink only (workspace)
    └── cardlink-pharmacy-example/  # CardLink + Pharmacy (workspace)
```

## Key Commands

### Development
- `yarn install` - Install all dependencies from root
- `yarn build` - Build all packages

### Running Example Apps
- `cd example && yarn android` - Run full example on Android
- `cd example && yarn ios` - Run full example on iOS
- `cd test/cardlink-demo && npm run android` - Run CardLink demo (published packages)

### iOS Setup
```bash
cd <example-dir>/ios
bundle install
bundle exec pod install
cd ..
yarn ios
```

### Android Clean Build
```bash
cd <example-dir>/android
./gradlew clean
cd ..
yarn android
```

## Module Dependencies

Each module depends on:
- `@ihreapotheken/ia-sdk-core` - Always required
- `@ihreapotheken/ia-sdk-interface` - Type definitions

## Configuration Files

### For Local Development (workspace)
Use `workspace:*` in package.json dependencies.

### For Published Packages
Use `^1.0.0` version specifiers and add `.npmrc`:
```
@ihreapotheken:registry=https://npm.pkg.github.com
```

## Native Configuration

### Android
- Application ID: `de.ihreapotheken.reactnative`
- Min SDK: 30
- Target SDK: 36
- Key files:
  - `android/app/build.gradle` - App configuration
  - `android/settings.gradle` - Project settings
  - `android/app/src/main/java/iasdkreactnative/example/MainActivity.kt` - Main component name

### iOS
- Bundle ID: `de.ihreapotheken.reactnative`
- Target: `IaSdkReactNativeExample`
- Key files:
  - `ios/Podfile` - CocoaPods configuration
  - `ios/IaSdkReactNativeExample/` - App source

## Module Registration Pattern

```typescript
import { iaSdk } from '@ihreapotheken/ia-sdk-core';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';

// Register only the modules you need
await iaSdk.register([
  new IaModuleCardLink(),
  new IaModulePharmacy(),
]);

// Initialize SDK
await iaSdk.initialize({
  accessKey: 'your-access-key',
  clientId: 'your-client-id',
  serverEnvironment: ServerEnvironment.Staging,
});
```

## Available Module Methods

### Core (always available after init)
- `iaSdk.startDashboardActivity()` - Open dashboard
- `iaSdk.logout()` - Reset user data
- `iaSdk.setGuestUserData(data)` - Set guest checkout info
- `iaSdk.finishAllActivities()` - Close SDK screens

### Pharmacy Module
- `pharmacy.launchPharmacyDetails()` - Show pharmacy details
- `pharmacy.setPharmacyId(id)` - Set specific pharmacy

### Ordering Module
- `ordering.transferPrescriptions(params)` - Transfer prescriptions
- `ordering.clearCart()` - Clear shopping cart
- `ordering.launchCartScreen()` - Show cart

### CardLink Module
- NFC functionality available through dashboard after registration

## Troubleshooting

### "Module not registered" error
Ensure the module name in `app.json` matches:
- Android: `MainActivity.kt` → `getMainComponentName()`
- iOS: Xcode project target name

### Metro bundler issues
```bash
npx react-native start --reset-cache
```

### Android build issues
```bash
cd android && ./gradlew clean && cd ..
```

### iOS pod issues
```bash
cd ios && rm -rf Pods Podfile.lock && bundle exec pod install && cd ..
```
