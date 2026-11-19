# IA SDK React Native Example App

This is a demo application showcasing the `@ihreapotheken/ia-sdk-react-native` library.

## Flavors

The example builds one app per flavor, from one native project:

| Flavor | App | Modules |
|---|---|---|
| `demo` (default) | Every SDK API, with test tools, in tabs ([src/demo/](src/demo/)). | All |
| `showcase` | Client showcase of transferring prescriptions to a local pharmacy ([src/prescription-upload-showcase/](src/prescription-upload-showcase/)). | Core (with Apofinder and appointments), ordering, pharmacy, prescription |

```sh
yarn android            # demo
yarn android:showcase   # showcase
yarn ios                # demo, scheme IaSdkReactNativeExample
yarn ios:showcase       # showcase, scheme showcase
```

Each flavor is an Android product flavor (`demoDebug`, `showcaseRelease`, ...) and an iOS scheme with its own Debug
and Release configurations. [index.js](index.js) registers one component per flavor, named after it, and the native
app launches the one of its flavor: Android from `BuildConfig.FLAVOR`, iOS from the `IA_FLAVOR` build setting. React
Native loads only the modules of the component it launches. All flavors share the application ID and bundle ID the
access key is bound to, so only one is installed at a time; only the app name differs.

The showcase has the module set of the NativeScript plugin's demo. On Android its build also leaves out the native
SDK libraries of over-the-counter and CardLink (see `configurations` in
[android/app/build.gradle](android/app/build.gradle)), so its size is that of an app integrating only its modules.
On iOS the core pod still depends on every module's pod, so both flavors link them all. Both flavors' JS bundles hold
both apps.

To add a flavor: register its component in [index.js](index.js), add it to `appFlavors` in
[android/app/build.gradle](android/app/build.gradle), and add the iOS configurations and scheme with
`ruby scripts/add-example-ios-flavor.rb <flavor> '<display name>'` from the repository root, followed by
`bundle exec pod install` in `ios/`.

## Code structure

| Folder | Contents |
|---|---|
| [src/ui/](src/ui/) | The design system both apps share: theme, icons, buttons, cards, rows. No SDK imports. |
| [src/demo/](src/demo/) | The demo: `tabs/` (one per SDK area), `components/`, `sdk/` (registration and initialization), `testing/` (event log, SDK listeners, host answers). |
| [src/prescription-upload-showcase/](src/prescription-upload-showcase/) | The showcase: `sections/` of its screen, `state/` (SDK state and button actions), `sdk/` (SDK calls and sample prescriptions). |
| [src/sdkConfig.ts](src/sdkConfig.ts) | Client ID and server environment, shared by every app. |

## Prerequisites

- Node.js >= 20
- [React Native development environment](https://reactnative.dev/docs/set-up-your-environment) set up for iOS and/or Android
- For iOS: CocoaPods installed (`gem install cocoapods`)

## Secrets Setup

Before running the app, you need to configure your secrets:

1. Copy the example secrets file:
   ```sh
   cp .secrets.example .secrets
   ```

2. Edit `.secrets` and add your access key:
   ```
   APPSDK_ACCESS_KEY=your_access_key_here
   ```

The app will throw an error on startup if `APPSDK_ACCESS_KEY` is not configured.

## Installation

From the repository root:

```sh
yarn install
```

For iOS, install CocoaPods dependencies:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
