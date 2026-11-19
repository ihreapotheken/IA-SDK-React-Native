# IA SDK React Native Example App

The example builds two apps, called flavors, from one React Native project and one native project per platform:

| Flavor | App | SDK modules |
|---|---|---|
| `demo` (default) | Every SDK API, with test tools, in tabs: initialization, screens, services, inline views, CardLink and an event log ([src/demo/](src/demo/)). | All |
| `showcase` | A client showcase of transferring prescriptions from an app to a local pharmacy, through checkout ([src/prescription-upload-showcase/](src/prescription-upload-showcase/)). | Core (with Apofinder and appointments), ordering, pharmacy, prescription |

Both flavors install as the same app (application ID and bundle ID `de.ihreapotheken.reactnative`, which the access key
is bound to), so installing one replaces the other. Only the app name differs: "AppSDK React Native Demo QA" or
"Rx Showcase".

## Setup

**Prerequisites**
- Node.js 20 or newer.
- A [React Native development environment](https://reactnative.dev/docs/set-up-your-environment) for Android and/or iOS.
- For iOS: Ruby with Bundler, which installs CocoaPods.

**1. Access key.** Copy the secrets file and add the SDK access key:

```sh
cd example
cp .secrets.example .secrets   # then set APPSDK_ACCESS_KEY=...
```

Both apps stop at startup without it.

**2. Dependencies.** From the repository root:

```sh
yarn install
```

For iOS, install the pods:

```sh
cd example/ios
bundle install
bundle exec pod install
```

**3. Backend.** `SERVER_ENVIRONMENT` in the repository's [.env](../.env) picks the backend both apps use:
`development` (DEV), `staging` (QA, the default) or `production` (PROD). QA is only reachable over the ia.de VPN. After
changing it, run `sh scripts/sync-app-label.sh` from the repository root so the iOS demo's name shows the new label.

## Running a flavor

### From the command line

Start Metro once in `example/`. It serves both flavors:

```sh
yarn start
```

Then, in another terminal in `example/`:

| | Android | iOS |
|---|---|---|
| Demo | `yarn android` | `yarn ios` |
| Showcase | `yarn android:showcase` | `yarn ios:showcase` |

To pick a device, add `--device "<name>"` (on Android, `yarn android --list-devices` lists them; on iOS, `--udid` and
`--simulator "<name>"` work too). The scripts pass the flavor to the React Native CLI: `--mode demoDebug` or
`--mode showcaseDebug` on Android, and on iOS the scheme and configuration (`--scheme showcase --mode Debug-showcase`).

### From Android Studio

Open `example/android`. In the Build Variants panel, set the `app` module to `demoDebug` or `showcaseDebug`, then run.
Start Metro first.

### From Xcode

Open `example/ios/IaSdkReactNativeExample.xcworkspace` and pick a scheme: `IaSdkReactNativeExample` for the demo,
`showcase` for the showcase. Then run. Start Metro first.

## Release builds

Release builds bundle the JavaScript, so they run without Metro.

**Android.** In `example/android`:

```sh
./gradlew assembleShowcaseRelease   # APK: app/build/outputs/apk/showcase/release/app-showcase-release.apk
./gradlew bundleShowcaseRelease     # App bundle: app/build/outputs/bundle/showcaseRelease/
```

Use `Demo` instead of `Showcase` for the demo. The release signing comes from `app/key.properties`, see
[android/app/build.gradle](android/app/build.gradle).

**iOS.** Archive the flavor's scheme, which uses its Release configuration:

```sh
xcodebuild archive -workspace example/ios/IaSdkReactNativeExample.xcworkspace -scheme showcase \
  -archivePath build/showcase.xcarchive
```

The deploy scripts ([scripts/deploy-demo-android.sh](../scripts/deploy-demo-android.sh),
[scripts/deploy-demo-ios.sh](../scripts/deploy-demo-ios.sh)) build and distribute the demo.

## How the flavors work

Each flavor has its own JS entry file: [index.js](index.js) for the demo, [index.showcase.js](index.showcase.js) for
the showcase. So each flavor's JS bundle holds only its app.

| | Android | iOS |
|---|---|---|
| Flavor | A product flavor, from `appFlavors` in [android/app/build.gradle](android/app/build.gradle) | A scheme with `Debug-<flavor>` and `Release-<flavor>` configurations; the demo uses `Debug` and `Release` |
| App name | `appName` in `appFlavors` | The `IA_DISPLAY_NAME` build setting |
| JS entry, debug (from Metro) | `BuildConfig.JS_MAIN_MODULE`, from `entryFile` in `appFlavors` | The `IA_JS_ENTRY` build setting, read from Info.plist ([AppDelegate.swift](ios/IaSdkReactNativeExample/AppDelegate.swift)) |
| JS entry, release (bundled) | The flavor's bundle task, set from `entryFile` | The `ENTRY_FILE` build setting |

### Modules per flavor

[flavors.json](flavors.json) lists each flavor's SDK modules, besides core, which every flavor includes:

```json
"showcase": {
  "modules": ["ordering", "pharmacy", "prescription"]
}
```

A flavor's build contains only its modules: their React Native packages, and the native SDK libraries and frameworks
they bring. Its JavaScript holds only the modules its entry file imports. So the showcase, without over-the-counter and
CardLink, has the size of an app integrating only its modules.

[package.json](package.json) still lists every module. A React Native app has one, and autolinking reads only it;
flavors.json decides which flavors each module links into:
- **iOS:** [react-native.config.js](react-native.config.js) links a module's pod only into its flavors' configurations,
  and the [Podfile](ios/Podfile) does the same for the SDK pods it brings.
- **Android:** only its flavors' variants depend on the module's project (`demoImplementation`, ...), so the others
  contain neither its React Native package nor its SDK libraries. Autolinking generates one package list for all
  variants, which gets these packages from
  [FlavorPackages](android/app/src/main/java/iasdkreactnative/example/FlavorPackages.kt): an empty package in a flavor
  without the module. Only the module's small C++ codegen glue, which autolinking also shares between variants, is
  built into every flavor; a flavor without the module never calls it.

To change a flavor's modules, edit flavors.json, import only those modules in the flavor's JavaScript, and run
`bundle exec pod install` in `example/ios`.

**Adding a flavor**
1. Add its entry file, `index.<flavor>.js`, registering its app as `IaSdkReactNativeExample`.
2. Add it, with its modules, to [flavors.json](flavors.json), and to `appFlavors` in
   [android/app/build.gradle](android/app/build.gradle).
3. Add its iOS configurations and scheme: from the repository root,
   `ruby scripts/add-example-ios-flavor.rb <flavor> '<display name>'`, then `bundle exec pod install` in
   `example/ios`.

Run the script again for an existing flavor after changing the Debug or Release configuration; it copies them afresh.

## Code structure

| Folder | Contents |
|---|---|
| [src/ui/](src/ui/) | The design system both apps share: theme, icons, buttons, cards and rows. It imports no SDK modules. |
| [src/demo/](src/demo/) | The demo: `tabs/` (one per SDK area), `components/`, `sdk/` (registration and initialization) and `testing/` (event log, SDK listeners, host answers). |
| [src/prescription-upload-showcase/](src/prescription-upload-showcase/) | The showcase: the `sections/` of its screen, `state/` (SDK state and button actions) and `sdk/` (SDK calls and sample prescriptions). |
| [src/sdkConfig.ts](src/sdkConfig.ts) | The client ID and server environment every app uses. |
| [flavors.json](flavors.json) | The SDK modules of each flavor. |
| [src/e2e/](src/e2e/) | The SDK-initialization smoke entry for the cross-platform E2E test. Start Metro with `IA_E2E=true` and the demo boots it instead. |

## Troubleshooting

- **`Task 'installDebug' is ambiguous`** on Android: the build has flavors, so pass one (`--mode demoDebug`) or use the
  yarn scripts.
- **"… has not been registered"**: each entry file registers its app as `IaSdkReactNativeExample`. Check that the
  flavor loads its entry: `entryFile` in `appFlavors` on Android, the `IA_JS_ENTRY` build setting on iOS.
- **"TurboModuleRegistry.getEnforcing(...): 'IaSdkOtc' could not be found"** (or another module): the flavor's
  JavaScript imports a module that its entry in [flavors.json](flavors.json) doesn't list.
- **"Couldn't connect to ia.de"** or initialization never finishes: the QA backend needs the VPN.
- **Pods out of date after adding a flavor or changing the Podfile**: run `bundle exec pod install` in `example/ios`.
- **Stale JavaScript**: `yarn start --reset-cache`.
