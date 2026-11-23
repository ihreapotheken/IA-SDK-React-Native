# Initialization

Before using any SDK features, you must register the modules and call `initialize`. This is the basic case: once
`initialize` has completed, just show an SDK screen and the SDK takes care of the rest. In the sections below, we'll
cover more advanced scenarios.

```typescript
await iaSdk.register([
  new IaModuleOverTheCounter(),
  new IaModuleOrdering(),
]);

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

// Prerequisites screens are shown automatically, if needed, before the start screen.
await iaSdk.startDashboardActivity();
```

Calling `initialize` will do the following:
* Validate your API key and fetch the entitlements (permissions) for your modules.
* Fetch the remote configuration (your legal data, onboarding, feature flags, remote colors etc.).
* Store the `prerequisites` options, used later when the prerequisites run.

Calling `initialize` doesn't show any screens, except for a loading indicator when `shouldShowIndicator` is `true`.

The prerequisites are a flow of screens that runs before the user can use the SDK:
* **Onboarding:** An introductory onboarding screen, shown only once. Onboarding is optional, it runs only when
  `runOnboardingIfNeeded` is `true`.
* **Legal Opt-In:** The user must opt in to use the SDK. This is presented the first time and when the version of some
  legal document changes. If your app has its own legal screens, you can set `runLegalIfNeeded` to `false`.
* **Apofinder:** The SDK requires a pharmacy to be set. It cannot run without one. You can provide the pharmacy in two
  ways:
    * Manually provide a pharmacy identifier with `setPharmacyId(...)` of the pharmacy module
      (`@ihreapotheken/ia-sdk-pharmacy`) after `initialize` has completed.
    * Let the prerequisites present **Apofinder**. This will allow the user to select a pharmacy from a list or map.

## Initialization and prerequisites explained
The initialization process can be divided into two key parts:
- SDK initialization: Fetches and configures essential components of the SDK. This step has no UI, except for a
  loading indicator. This is what `initialize` does.
- Prerequisites: A flow of screens that runs only when necessary. While onboarding and legal steps are optional, this
  phase ensures that the pharmacy is set, which is mandatory.

The prerequisites flow can be run in two ways:
- **Automatically (recommended):** When you show any SDK screen, the SDK first runs the prerequisites that are still
  needed, and then shows the screen. You don't need to do anything for this, both the iOS and the Android SDK do it.
- **Explicitly (optional):** By calling `launchPrerequisiteFlow`, when you want the prerequisites to run at a specific
  moment.

Regardless of how many times the prerequisites are triggered, the screens are presented only if needed (the first
time, or when something changed, e.g. a new version of a legal document).

## Automatic prerequisites (recommended)
The preferred way is to call `initialize` and then simply show SDK screens, e.g. `startDashboardActivity()`. The
prerequisites run with the options you passed in `initialization.prerequisites`.

```typescript
await iaSdk.initialize(config);

// Later, when the user enters the part of your app where IA SDK is used.
await iaSdk.startDashboardActivity();
```

However, it's important to note that the prerequisites only run automatically when a screen is shown. If you call an
SDK function that requires the prerequisites (e.g. a selected pharmacy) before showing any screen, it will not run them.
In that case, run them explicitly first.

## Running prerequisites explicitly (optional)
Call `launchPrerequisiteFlow` after `initialize` has completed. It shows only the steps that are still needed and
returns right away when all of them are done. Don't show SDK screens or components until it has returned.

```typescript
const result = await iaSdk.launchPrerequisiteFlow();
if (!result.isCancelled) {
  // Proceed with SDK, e.g. iaSdk.startDashboardActivity();
}
```

When `isCancelled` is `false`, the prerequisites are completed and a pharmacy is selected (unless
`runApofinderIfNeeded` is `false`). When the user cancelled the flow, you must not show any IA SDK screens or
components.

## Initialization state
You can check the current state with `getInitializationState()` or `isInitialized()`, and listen to changes with
`addInitializationStateListener`:

```typescript
const subscription = iaSdk.addInitializationStateListener((state) => {
  // Uninitialized, Initializing, Initialized or Error.
});

// When you no longer need it.
subscription.remove();
```

## Common scenarios
Here we will cover some common scenarios and how to best handle initialization and prerequisites.

**Scenario 1:** IA SDK is a vital part of your app and you don't mind that the prerequisites screens are shown when
the app starts.  
Call `register` and `initialize` at start, followed by `launchPrerequisiteFlow`. You can then use IA SDK screens and
functions as you wish.  
If something fails, you must handle it at start.

**Scenario 2:** You run IA SDK from a single entry point and don't use any IA SDK functions before.  
Call `register` and `initialize` at start, or just before the user enters the part of your app where IA SDK is used.
Then simply show an SDK screen, e.g. `startDashboardActivity()`, and the prerequisites run automatically.  
This is the recommended setup.

**Scenario 3:** You run IA SDK from a single entry point, but you might call some IA SDK functions before it.  
Call `register` and `initialize` at start of your app. Most functions can be used after `initialize`. If some function
requires a pharmacy to be set, call `launchPrerequisiteFlow` before it (or set the pharmacy with `setPharmacyId`).

## Other
To reset or skip certain steps, use the following code:

```typescript
// Sets the pharmacy to none and resets the legal documents and onboarding flags.
await iaSdk.resetPrerequisites();

// Marks the legal documents as not accepted. iOS only.
await iaSdk.resetLegalDisclaimer();

// Clears the user's analytics consent answer, so it's asked again.
await iaSdk.resetAnalyticsConsent();

// Marks the onboarding step as shown, so it won't be shown again. iOS only.
await iaSdk.setIsOnboardingShown(true);

// Cleans the prerequisites cache. iOS only.
await iaSdk.cleanCache(false, true);

// Sets the pharmacy ID, after initialize. Requires the pharmacy module.
const pharmacy = iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);
await pharmacy.setPharmacyId('12345');

// Saves the pharmacy ID without loading it, before initialize. iOS only, requires the pharmacy module.
await pharmacy.savePharmacyId('12345');

// Whether the prerequisites are completed, so the prerequisites flow wouldn't show a screen.
const isCompleted = await iaSdk.isPrerequisiteFlowCompleted();
```

## Platform differences
The plugin keeps both platforms as close as possible, but the native SDKs differ in a few places:

- **Cancelling prerequisites:** On iOS they can be made cancellable with `isCancellable`; on Android they always are.
- **Helpers:** `resetLegalDisclaimer`, `setIsOnboardingShown`, `cleanCache` and `savePharmacyId` are iOS only. On
  Android they log a warning and do nothing.
- **Prerequisites completion:** `isPrerequisiteFlowCompleted` always needs a pharmacy on iOS, and fails when it can't
  be loaded. On Android a pharmacy isn't needed with `runApofinderIfNeeded: false`, and one that can't be loaded
  counts as selected.
