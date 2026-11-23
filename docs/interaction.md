# SDK Interaction

IA SDK allows the host app to receive events and override default behaviors. In React Native there is no single
delegate, instead:
* **Listeners** send you events, e.g. when the cart is updated. Add them with the `add…Listener` methods, which return
  a subscription; call its `remove()` when you no longer need it.
* **Callbacks** let you override default behaviors, e.g. what happens when the SDK wants to open the cart. They are
  function properties that you set.

Core listeners and callbacks are on `iaSdk`, module ones on the module, e.g. the ordering module from
`iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering)`.

> [!TIP]
> It is best to add listeners and set callbacks immediately after you call `register`, so you don't miss any events.
> Listeners don't replay events that were sent before you added them.

## Example of receiving SDK event
`addCartUpdatedListener` sends the new cart state when the cart is updated.
```typescript
const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
const subscription = ordering.addCartUpdatedListener((cartState) => {
  console.log(cartState.totalAmountInCart);
});
```

Available listeners:

| Listener | Event |
|---|---|
| `iaSdk.addInitializationStateListener` | Initialization state changed |
| `iaSdk.addAnalyticsEventListener` | Analytics event logged for the host app, e.g. `screen_view` or `purchase`, see [Analytics](#analytics) |
| `iaSdk.addLogMessageListener` | SDK log message, for debugging (iOS only) |
| `iaSdk.addApofinderPharmacyChangedListener` | The user selected a pharmacy in Apofinder; gives the `pharmacyId` and `isFromPrerequisites` |
| `addCartUpdatedListener` (ordering module) | Cart updated |
| `addOrderFinishedListener` (ordering module) | Order finished |
| `addScannerCameraErrorListener` (prescription module) | Scanner camera error (iOS only) |
| `add…Listener` (CardLink module) | CardLink events, e.g. `addEventListener` and `addPrescriptionsRedeemedListener` |

## Example of overriding default behavior
`onSdkWillNavigateToTarget` is called when some overridable action is performed. Return `true` to let the SDK perform
its default behavior, or `false` when your app handled it.

On example of cart screen, if you don't set this callback, the default behavior is for the SDK to show its cart screen
over the current screen.

This behavior is fine in most cases, but if, for example, your app already includes a cart screen embedded inside a tab
bar, you can override this callback to switch to the cart tab instead of showing a new screen.

```typescript
// We will switch to cart tab in our example app.
iaSdk.onSdkWillNavigateToTarget = (navigationTarget) => {
  switch (navigationTarget) {
    case IaSdkNavigationTarget.Cart:
      // Use this to select cart in your app, e.g.:
      // navigation.navigate('Cart');
      return false;
    default:
      return true;
  }
};
```

> [!IMPORTANT]
> On Android, the SDK waits at most 500 ms for the answer, otherwise it performs its default behavior. Answer right
> away and do any slow work afterwards, or both your screen and the SDK's screen will be shown.

Navigation targets (`IaSdkNavigationTarget`):

| Target | When | Default behavior |
|---|---|---|
| `Cart` | SDK wants to open the cart | Shows the SDK cart screen |
| `PharmacyDetails` | SDK wants to open the pharmacy details | Shows the SDK pharmacy screen |
| `Apofinder` | SDK wants to open Apofinder, e.g. to change the pharmacy | Shows the SDK Apofinder |
| `ThankYou` | Order and payment are processed | Shows the SDK thank you screen |
| `Imprint` | "Impressum" footer button tapped | Shows the imprint from CMS |
| `Start` | SDK wants to open the start screen (Android only) | Shows the SDK start screen |
| `Search` | SDK wants to open the product search (Android only) | Shows the SDK product search |
| `RedeemPrescription` | SDK wants to open the redeem prescription screen (Android only) | Shows the SDK screen |
| `ThankYouCompleted` | User finished the thank you screen (Android only) | — |

## Other callbacks

| Callback | Called when |
|---|---|
| `onPrescriptionPhotoScanned` (prescription module) | A paper prescription is photographed; lets you take it over instead of the SDK |
| `onEPrescriptionScanned` (prescription module) | An e-prescription (eRezept) is scanned; lets you take it over instead of the SDK |
| `iaSdk.onSdkBackAction` | The user goes back on an SDK screen; decides whether the screen may close (Android only) |

## Analytics
The SDK sends no analytics anywhere itself. It logs events for the host app, which forwards them to its own analytics
tool. Events are only logged when the client has analytics enabled in the SDK's CMS and the user accepted analytics,
on the legal screen or the "Datenverarbeitung" screen. On Android they also need `isAnalyticsEnabled` in the
configuration passed to `initialize`, which is on by default.

Each event has a `name` from `IaSdkAnalyticsEventNames` and `parameters` keyed by `IaSdkAnalyticsParameterNames`.
No price or order value is included. New events are added over time, so handle unknown names.
```typescript
iaSdk.addAnalyticsEventListener((event) => {
  switch (event.name) {
    case IaSdkAnalyticsEventNames.screenView: {
      const screenName = event.parameters[IaSdkAnalyticsParameterNames.screenName];
      // Forward the screen view.
      break;
    }
    default:
      // Forward event.name and event.parameters.
      break;
  }
});
```

To ask the user again, clear their answer, so the legal screen shows the question the next time it runs:
```typescript
await iaSdk.resetAnalyticsConsent();
```

## Platform differences
- **Imprint:** On Android, `Imprint` is only reported when `footer.isImprintHandledByHostApp` is `true`, and then the
  SDK never shows its own imprint.
- **Screens opened without asking:** On Android, the screens opened from `IaProductGrid` (product details) and by
  `transferPrescriptions` don't call `onSdkWillNavigateToTarget`.
- **Cart state:** On Android, `addCartUpdatedListener` only carries the counts (`totalProducts`,
  `totalPrescriptions`); on iOS it also carries the `products`.
- **Analytics events:** On Android, parameter values are always strings.
- **Pharmacy changes:** On Android `addApofinderPharmacyChangedListener` is only called for Apofinder opened with
  `launchApofinder`, not for Apofinder the SDK opens itself. On both platforms, Apofinder embedded with
  `IaSdkScreenView` isn't reported.
