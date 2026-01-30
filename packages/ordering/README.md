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

// Transfer prescriptions for checkout
await ordering.transferPrescriptions({
  images: ['base64-encoded-image...'],  // JPG/PNG images
  pdfs: ['base64-encoded-pdf...'],       // PDF files
  codes: ['{"code": "..."}'],            // eRezept JSON codes
  orderId: 'client-order-123',           // Optional client order ID
});

// Clear the shopping cart
await ordering.clearCart();

// Launch the cart screen
await ordering.launchCartScreen();
```

## Related

- [Flutter SDK Ordering](https://github.com/ihreapotheken/IA-SDK-Flutter) - `ia_ordering` module
