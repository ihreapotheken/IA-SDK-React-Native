# How to use components

IA SDK components (e.g. `IaProductGrid`) can be embedded anywhere in your app's UI. Like every IA SDK screen, they
require:
* **SDK initialization** to be finished. It fetches the data the SDK needs and has no UI, except for an optional
  loading indicator.
* **Prerequisites** to be completed. They are a flow of screens (onboarding, legal opt-in and pharmacy selection in
  Apofinder), presented only when needed.

> [!TIP]
> To learn more about initialization and prerequisites in general, see [Initialization](../initialization.md).

Until both are done, a component shows only a loading indicator.

This is easy to handle if you call `initialize` before any component is shown, e.g. when your app starts.

It gets trickier when a component can be shown before you call `initialize`, or you don't want the prerequisites
screens to appear where the component is shown, for example:

> Your app has a single SDK entry point on the third tab, where you call `initialize`. Now you want to add
> `IaProductGrid` to the first tab, which the user sees first.

This guide shows how to handle initialization and prerequisites in such cases.

## Initialization and prerequisites

Components don't initialize the SDK themselves, so you must call `initialize` before a component is shown. `initialize`
never presents prerequisites screens. Instead, the first component or screen that is shown runs the prerequisites that
are still needed. Choose one of the following options.

### Option 1: Call `initialize` in every place that uses the SDK
Call `initialize` both in your SDK entry point and before showing the component. This is safe because only the first
successful call has an effect, later calls return without applying their configuration. Pass the same configuration
everywhere.

```typescript
await iaSdk.initialize(config);
// Show IaProductGrid
```

> [!NOTE]
> Prerequisites screens are presented as soon as the component appears (only if needed). If you don't want that, see
> [Prerequisites check](#prerequisites-check) below.

### Option 2: Call `initialize` once at app start
Call `initialize` once when your app starts. After that, components and screens can be used anywhere in the app.

> [!NOTE]
> Prerequisites screens are presented as soon as the first component or screen appears (only if needed), e.g. the
> component on the first tab. If you don't want that, see [Prerequisites check](#prerequisites-check) below.

> [!TIP]
> If you want the prerequisites to run before any component or screen is shown, call `launchPrerequisiteFlow`, and
> show the component only if the flow wasn't cancelled. This also lets you handle errors yourself, instead of the SDK
> showing its own error screen. See
> [Running prerequisites explicitly](../initialization.md#running-prerequisites-explicitly-optional).

## Prerequisites check

If you don't want prerequisites screens (e.g. onboarding) to appear where the component is shown, e.g. on the first
tab, you can:
* Run prerequisites yourself before the component is shown, by calling `launchPrerequisiteFlow` (explained above), or
* Show the component only if the user has already completed prerequisites in your SDK entry point.

For the second option, use `isPrerequisiteFlowCompleted` and show the component only if it returns `true`.
* It is a one-time check that returns the current state. Call it every time the screen with the component is shown
  (e.g. when the user switches to its tab), so the component shows up once the user has completed prerequisites in
  your SDK entry point.
* It checks the prerequisites you passed in `initialization.prerequisites`.
* It fails if the SDK is not initialized, so call `initialize` first.

```typescript
await iaSdk.initialize(config);
const isCompleted = await iaSdk.isPrerequisiteFlowCompleted();
if (isCompleted) {
  // Show IaProductGrid
}
```

> [!CAUTION]
> Use this check only to decide whether to add the component to your layout. Don't use it to hide and show the
> component repeatedly, as that destroys its state and makes it reload.

## Platform differences
- **Prerequisites check:** On iOS, `isPrerequisiteFlowCompleted` always needs a pharmacy, and fails when it can't be
  loaded. On Android a pharmacy isn't needed with `runApofinderIfNeeded: false`, and one that can't be loaded counts
  as selected.
