# AppSDK React Native Module

React Native [Module](https://reactnative.dev/docs/the-new-architecture/create-module-library) project implemented with the ia.de AppSDK services.

## 1. General Info

---

The plugin implementation is based on the native AppSDK libraries developed by the ia.de team with Kotlin and Swift.

These native libraries offer both checkout services as well as view components in order to ensure seamless integration
with any client setup.

Public API Reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## 2. Developer Setup

---

- [React Native SDK](https://reactnative.dev/docs/set-up-your-environment) 0.81.0 and up
- [Node.js](https://nodejs.org/) 20.x and up
- [npm](https://docs.npmjs.com/getting-started) 10.x and up
- [GitHub Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) for package registry access

## 3. Platform Support

---

The library is supported on both of the major mobile operating systems, with constraints noted below:

### Android

- Minimum SDK Version: `30`
- Target SDK Version: `36`
- Kotlin `2.1.0`
- Gradle `8.12.3`

### iOS

- Minimum iOS Version: `15`
- Xcode: `16.0`
- Swift `5.9`

## 4. Client Setup

---

For official reference, please see
[the React Native documentation](https://reactnative.dev/docs/libraries)
on using libraries.

### 4.1. Configure the GitHub Package Registry

The library is accessed from GitHub NPM Package Registry.

Create a `.npmrc` file in the root of your project:

```
@ihreapotheken:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Replace `YOUR_GITHUB_PAT` with your GitHub Personal Access Token.

### 4.2. Install the packages

Install the core package and the modules you need:

```sh
# Core package (required)
npm install @ihreapotheken/ia-sdk-core@VERSION

# Install only the modules you need
npm install @ihreapotheken/ia-sdk-cardlink@VERSION
npm install @ihreapotheken/ia-sdk-pharmacy@VERSION
npm install @ihreapotheken/ia-sdk-ordering@VERSION
npm install @ihreapotheken/ia-sdk-prescription@VERSION
npm install @ihreapotheken/ia-sdk-over-the-counter@VERSION
```

The `VERSION` value can be referenced from the
[package release page](https://github.com/ihreapotheken/IA-SDK-React-Native/packages).

### 4.3. iOS Permissions

Add the following keys to your `Info.plist` file based on the modules you use:

```xml
<!-- Location permission - required for Apofinder (pharmacy finder) module -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Used to show pharmacies nearby.</string>

<!-- Camera permission - required for Prescription (RX) module -->
<key>NSCameraUsageDescription</key>
<string>Camera access is needed for prescription upload.</string>

<!-- NFC permission - required for CardLink module -->
<key>NFCReaderUsageDescription</key>
<string>NFC is used to read your health insurance card for prescription redemption.</string>
<key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
<array>
    <string>D2760001448000</string>
    <string>D27600014601</string>
    <string>D27600014606</string>
    <string>D27600000102</string>
    <string>A000000167455349474E</string>
    <string>D27600006601</string>
    <string>D27600014602</string>
    <string>E828BD080FA000000167455349474E</string>
    <string>E828BD080FD27600006601</string>
    <string>D27600014603</string>
</array>
```

| Permission | Key | Required For | Purpose |
|------------|-----|--------------|---------|
| Location (When In Use) | `NSLocationWhenInUseUsageDescription` | Apofinder module | Find nearby pharmacies and get directions |
| Camera | `NSCameraUsageDescription` | Prescription (RX) module | Scan and upload prescriptions via camera |
| NFC | `NFCReaderUsageDescription` | CardLink module | Read health insurance cards via NFC for prescription redemption |

**Note:** The `com.apple.developer.nfc.readersession.iso7816.select-identifiers` key with the listed AIDs is required for CardLink to communicate with German health insurance cards (eGK) and related secure messaging protocols.

### 4.4. Module Registration and Initialization

The SDK uses a modular architecture. Register only the modules you need to minimize app size:

```typescript
import { iaSdk, ServerEnvironment } from '@ihreapotheken/ia-sdk-core';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';

// Register modules before initialization
await iaSdk.register([
  new IaModuleCardLink(),
  new IaModulePharmacy(),
]);

// Initialize the SDK
await iaSdk.initialize({
  accessKey: 'your-access-key',
  clientId: 'your-client-id',
  serverEnvironment: ServerEnvironment.Staging,
});
```

Each module must be registered before calling `initialize()`. The registration and initialization
should only be invoked once during the application runtime.

### 4.5. Using the SDK

After initialization, use the SDK methods:

```typescript
import { iaSdk, Salutation, IaBaseModule } from '@ihreapotheken/ia-sdk-core';
import type { IaPharmacyModule } from '@ihreapotheken/ia-sdk-interface';

// Core methods (always available after initialization)
await iaSdk.startDashboardActivity();
await iaSdk.logout();
await iaSdk.finishAllActivities();

// Set guest user data for checkout
await iaSdk.setGuestUserData({
  salutation: Salutation.Mr,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumberCountryCode: 49,
  phoneNumberWithoutCountryCode: '1234567890',
});

// Access registered modules
if (iaSdk.hasModule(IaBaseModule.Pharmacy)) {
  const pharmacy = iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);
  await pharmacy.launchPharmacyDetails();
  await pharmacy.setPharmacyId('pharmacy-123');
}
```

## 5. Available Modules

---

| Package | Description | Key Methods |
|---------|-------------|-------------|
| `@ihreapotheken/ia-sdk-core` | Core SDK functionality (required) | `initialize()`, `startDashboardActivity()`, `logout()`, `setGuestUserData()` |
| `@ihreapotheken/ia-sdk-interface` | TypeScript interface definitions | Type exports only |
| `@ihreapotheken/ia-sdk-cardlink` | NFC prescription transfer | Available through dashboard |
| `@ihreapotheken/ia-sdk-pharmacy` | Pharmacy details and management | `launchPharmacyDetails()`, `setPharmacyId()` |
| `@ihreapotheken/ia-sdk-ordering` | Order management and checkout | `transferPrescriptions()`, `clearCart()`, `launchCartScreen()` |
| `@ihreapotheken/ia-sdk-prescription` | Prescription management | Module registered for UI |
| `@ihreapotheken/ia-sdk-over-the-counter` | OTC product browsing | `launchProductSearchRoute()` |

### Module Dependency Graph

```
@ihreapotheken/ia-sdk-interface (foundation)
    ↑
    └─── @ihreapotheken/ia-sdk-core (required)
         ↑ (peer dependency)
         ├─── @ihreapotheken/ia-sdk-cardlink
         ├─── @ihreapotheken/ia-sdk-pharmacy
         ├─── @ihreapotheken/ia-sdk-ordering
         ├─── @ihreapotheken/ia-sdk-over-the-counter
         └─── @ihreapotheken/ia-sdk-prescription
```

## 6. Example Apps

---

### Full Example

The `example/` directory contains a complete example app demonstrating all modules:

```sh
cd example
yarn install
yarn android  # or yarn ios
```

### Minimal Examples

The `test/` directory contains minimal example apps for specific use cases:

- `test/cardlink-demo/` - CardLink module only using published packages

## 7. Project Structure

---

```
├── packages/              # SDK modules
│   ├── core/             # Core SDK functionality
│   ├── interface/        # Shared TypeScript interfaces
│   ├── cardlink/         # NFC prescription transfer
│   ├── pharmacy/         # Pharmacy details
│   ├── ordering/         # Order management
│   ├── over-the-counter/ # OTC products
│   └── prescription/     # Prescription management
├── example/              # Full example app (workspace)
└── test/                 # Minimal example apps
    └── cardlink-demo/    # CardLink only (published packages)
```

## 8. App Size

---

Example app sizes with CardLink module only:

| Platform | Size |
|----------|------|
| Android APK (all architectures) | ~174 MB |
| iOS App | ~52 MB |

Note: Android APK size is for all architectures. Play Store delivery uses split APKs (~45-50 MB per device).

## 9. Related Projects

---

| Project | Description |
|---------|-------------|
| [IA-SDK-Flutter](https://github.com/ihreapotheken/IA-SDK-Flutter) | Flutter plugin implementation |
| [IA-SDK-Android](https://github.com/ihreapotheken/IA-SDK-Android) | Native Android SDK |
| [IA-SDK-iOS](https://github.com/ihreapotheken/IA-SDK-iOS) | Native iOS SDK |

---

For further information, please see the
[API reference](https://ihreapotheken.github.io/docs/appsdk/react-native) 
and [Usage and Testing documentation](https://ihreapotheken.github.io/docs/appsdk/common/usage-and-testing).
