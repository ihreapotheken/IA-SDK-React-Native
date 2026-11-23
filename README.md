# AppSDK React Native Module

React Native [Module](https://reactnative.dev/docs/the-new-architecture/create-module-library) project implemented with the ia.de AppSDK services.

The plugin implementation is based on the native AppSDK libraries developed by the ia.de team with Kotlin and Swift.

These native libraries offer both checkout services as well as view components in order to ensure seamless integration
with any client setup.

Public API Reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## 1. Developer Setup

---

- [React Native SDK](https://reactnative.dev/docs/set-up-your-environment) 0.81.0 and up
- [Node.js](https://nodejs.org/) 20.x and up
- [npm](https://docs.npmjs.com/getting-started) 10.x and up
- [GitHub Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) for package registry access

## 2. Platform Support

---

The library is supported on both of the major mobile operating systems, with constraints noted below:

### Android

- Minimum SDK Version: `30`
- Target SDK Version: `36`
- Kotlin `2.1.0`
- Gradle `8.12.3`

### iOS

- Minimum iOS Version: `15`
- Xcode: `26.2`

## 3. Client Setup

---

For official reference, please see
[the React Native documentation](https://reactnative.dev/docs/libraries)
on using libraries.

### 3.1. Configure the GitHub Package Registry

The library is accessed from GitHub NPM Package Registry.

Create a `.npmrc` file in the root of your project:

```
@ihreapotheken:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Replace `YOUR_GITHUB_PAT` with your GitHub Personal Access Token.

### 3.2. Install the packages

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

### 3.3. iOS Project Setup

See [iOS Project Setup](https://github.com/ihreapotheken/IA-SDK-iOS/blob/main/Docs/iOSProjectSetup.md).

### 3.4. Plugin usage

1. **Set the app identifier**  
The API key is linked to your app's identifier, so set it on both platforms:
   - iOS: the bundle identifier, in the app target's Build Settings (`PRODUCT_BUNDLE_IDENTIFIER`).
   - Android: the `applicationId`, in `android/app/build.gradle`.

2. **Import the required packages**  
`@ihreapotheken/ia-sdk-core` is mandatory, the module packages are optional. In this example we will be using product
search from `@ihreapotheken/ia-sdk-over-the-counter` and cart from `@ihreapotheken/ia-sdk-ordering`.
```typescript
import { iaSdk, ServerEnvironment } from '@ihreapotheken/ia-sdk-core';
import { IaModuleOverTheCounter } from '@ihreapotheken/ia-sdk-over-the-counter';
import { IaModuleOrdering } from '@ihreapotheken/ia-sdk-ordering';
```

3. **Register modules**  
The first step is to register all the modules you plan to use. This must be done before calling any other function
or presenting any screens, so we recommend doing it right when the app starts.
This step is required because modules can be interconnected. For example, registering `IaModuleOrdering` makes the
**Cart** feature (from `@ihreapotheken/ia-sdk-ordering`) internally available to the **Product Search** feature (from
`@ihreapotheken/ia-sdk-over-the-counter`), enabling features like a cart button on the search screen.
Integrations and Apofinder are part of the core package and are always registered.
```typescript
await iaSdk.register([
  new IaModuleOverTheCounter(),
  new IaModuleOrdering(),
]);
```
> [!IMPORTANT]
> Register all modules in one call, before `initialize`.

4. **Basic setup and initialize**  
Next, enter your API key, client ID and other options you might need in the configuration, and pass it to
`initialize`. This fetches all required data and enables your modules.
```typescript
await iaSdk.initialize({
  accessKey: 'ENTER YOUR API KEY HERE',
  clientId: 'ENTER YOUR CLIENT ID HERE',
  serverEnvironment: ServerEnvironment.Production,
  initialization: {
    shouldShowIndicator: true,
    prerequisites: {
      runLegalIfNeeded: true,
      runOnboardingIfNeeded: true,
      runApofinderIfNeeded: true,
    },
  },
});
```
> [!TIP]
> To learn more about initialization, see [Initialization](docs/initialization.md).

## 4. Guides

[Public API Overview](docs/public_api_overview.md)  
[Initialization](docs/initialization.md)  
[Presentation](docs/presentation.md)  
[Appearance](docs/appearance.md)  
[SDK Interaction](docs/interaction.md)

## 5. Screens

[Start Screen](docs/screens/start_screen.md)  
[Apofinder Screen](docs/screens/apofinder_screen.md)  
[Cart Screen](docs/screens/cart_screen.md)  
[Pharmacy Screen](docs/screens/pharmacy_screen.md)  
[Product Search Screen](docs/screens/product_search_screen.md)  
[Prescription Scanner Screen](docs/screens/prescription_scanner_screen.md)  
[Redeem Prescription Screen](docs/screens/redeem_prescription_screen.md)

## 6. Components

[How to use components](docs/components/how_to_use_components.md)  
[IaProductGrid](docs/components/product_grid.md)  
[IaCartButton](docs/components/cart_button.md)

## 7. Example Apps

---

### Example App

The `example/` directory builds two apps, as flavors of one project:

- **`demo`**: every module and API of the SDK, with test tools.
- **`showcase`**: a client showcase of transferring prescriptions to a local pharmacy, with the ordering, pharmacy and
  prescription modules.

```sh
yarn install            # in the repository root
cd example
yarn start              # Metro, for both flavors
yarn android            # demo; yarn ios on iOS
yarn android:showcase   # showcase; yarn ios:showcase on iOS
```

[example/README.md](example/README.md) covers the setup (access key, pods, backend), running each flavor from the
command line, Android Studio and Xcode, release builds, and adding a flavor.

### Minimal Examples

The `test/` directory contains minimal example apps for specific use cases:

- `test/cardlink-demo/` - CardLink module only using published packages

## 8. Project Structure

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

## 9. App Size

---

What the ia.de AppSDK adds to a React Native app, measured with ia.de AppSDK 2.10.1 and React Native 0.81 (Hermes, new
architecture) on the example's `showcase` flavor. Its modules are core (with Apofinder and appointments), ordering,
pharmacy and prescription. "Empty app" is the same app without the ia.de SDK. 1 MB = 1,000,000 bytes.

**Android** (arm64)

| | R8 enabled | R8 disabled |
|---|---|---|
| APK | Empty app 14.6 MB + ia.de AppSDK 38.5 MB = 53.1 MB | Empty app 17.0 MB + ia.de AppSDK 48.0 MB = 65.0 MB |
| Google Play download | Empty app 6.3 MB + ia.de AppSDK 23.7 MB = 30.0 MB | Empty app 8.7 MB + ia.de AppSDK 33.2 MB = 41.9 MB |
| Installed | Empty app 16.3 MB + ia.de AppSDK 57.1 MB = 73.4 MB | Empty app 23.2 MB + ia.de AppSDK 95.4 MB = 118.6 MB |

**iOS** (arm64)

| | Size |
|---|---|
| App Store download (approximate) | Empty app 5.2 MB + ia.de AppSDK 16.7 MB = 21.9 MB |
| Installed | Empty app 17.8 MB + ia.de AppSDK 33.5 MB = 51.3 MB |

**With every module** (adding over-the-counter and CardLink, as the `demo` flavor does):
- Android, R8 enabled: APK 61.0 MB, Google Play download 37.5 MB, installed 89.1 MB.
- iOS: App Store download about 33.5 MB, installed 69.8 MB.

How it was measured:
- **APK** is the universal APK for arm64 built from the release app bundle, the file you'd install directly.
- **Google Play download** and **installed** are for a Pixel 7a (arm64, 420 dpi, German), computed with bundletool from
  the app bundle. Installed is larger than the download because Android keeps native libraries and code uncompressed.
- **R8** shrinks the code of release builds. Host apps normally enable it; the example ships with it off.
- **Android empty app:** the showcase built without any ia.de SDK library. Neither contains the modules the showcase
  leaves out, see [example/README.md](example/README.md#modules-per-flavor).
- **iOS empty app:** the showcase's signed release build minus the ia.de frameworks it embeds (IACore, IAIntegrations,
  IAOrdering, IAPharmacy, IAPrescription, IOSKit). The SDK's React Native wrapper code, a small part of the app binary,
  counts toward the empty app.
- **App Store download** is approximated by the zipped app. App Store Connect reports the exact size after an upload.

## 10. Related Projects

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
