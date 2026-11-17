# @ihreapotheken/ia-sdk-ordering

AppSDK Ordering service for order management and checkout.

## Implementation

For AppSDK usage, see the main [README.md](https://ihreapotheken.github.io/docs/appsdk/react-native) file.

API reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## Installation

```sh
# Configure the GitHub Package Registry in .npmrc:
# @ihreapotheken:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

npm install @ihreapotheken/ia-sdk-core@VERSION
npm install @ihreapotheken/ia-sdk-ordering@VERSION
```

## Usage

The module should be instantiated, after which it must be forwarded to the `iaSdk.register` method for runtime configuration:

```typescript
import { iaSdk, ServerEnvironment, IaBaseModule } from '@ihreapotheken/ia-sdk-core';
import type { IaOrderingModule } from '@ihreapotheken/ia-sdk-interface';
import { IaModuleOrdering } from '@ihreapotheken/ia-sdk-ordering';

const orderingModule = new IaModuleOrdering();

async function initSdk() {
  await iaSdk.register([
    orderingModule,
    // Other modules...
  ]);

  await iaSdk.initialize({
    accessKey: 'your-access-key',
    clientId: 'your-client-id',
    serverEnvironment: ServerEnvironment.Staging,
  });
}
```

## Available Methods

Access the module after initialization:

```typescript
const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);

// Transfer prescriptions for checkout; resolves once they're in the cart
await ordering.transferPrescriptions({
  images: ['base64-encoded-image...'],  // JPG/PNG images
  pdfs: [{ data: 'base64-encoded-pdf...', insuranceType: PrescriptionInsuranceType.PublicHealthcare }],
  codes: ['{"urls": ["..."]}'],          // eRezept JSON codes
  orderId: 'client-order-123',           // Optional client order ID
  finishAction: IaTransferPrescriptionsFinishAction.ShowBottomSheet, // openCart (default), showBottomSheet, noAction
  showActivityIndicator: true,           // iOS
});

await ordering.clearCart();
await ordering.launchCartScreen();

// iOS only
const details = await ordering.getCartDetails({ allowCached: false });  // JSON string or null
const cart = await ordering.getCartState({ shouldEmitCartUpdate: true }); // CartState or null
await ordering.deleteOrderHistory();

// Listeners
ordering.addCartUpdatedListener((state) => {});
ordering.addOrderFinishedListener(({ orderCode, orderCodes, clientOrderIDs }) => {});
```

## Components

```tsx
import { IaCartButton } from '@ihreapotheken/ia-sdk-ordering';

<IaCartButton />                              // opens the SDK cart
<IaCartButton onPress={() => openMyCart()} /> // the host app handles the tap
```

## Related

- [Flutter SDK Ordering](https://github.com/ihreapotheken/IA-SDK-Flutter) - `ia_ordering` module
