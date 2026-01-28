# @ihreapotheken/ia-sdk-over-the-counter

AppSDK Over-the-Counter service for OTC product browsing and purchasing.

## Implementation

For AppSDK usage, see the main [README.md](https://ihreapotheken.github.io/docs/appsdk/react-native) file.

API reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## Installation

```sh
# Configure the GitHub Package Registry in .npmrc:
# @ihreapotheken:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

npm install @ihreapotheken/ia-sdk-core@VERSION
npm install @ihreapotheken/ia-sdk-over-the-counter@VERSION
```

## Usage

The module should be instantiated, after which it must be forwarded to the `iaSdk.register` method for runtime configuration:

```typescript
import { iaSdk, ServerEnvironment, IaBaseModule } from '@ihreapotheken/ia-sdk-core';
import type { IaOverTheCounterModule } from '@ihreapotheken/ia-sdk-interface';
import { IaModuleOverTheCounter } from '@ihreapotheken/ia-sdk-over-the-counter';

const otcModule = new IaModuleOverTheCounter();

async function initSdk() {
  await iaSdk.register([
    otcModule,
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
const otc = iaSdk.getModule<IaOverTheCounterModule>(IaBaseModule.OverTheCounter);

// Launch product search screen
await otc.launchProductSearchRoute();
```

## Related

- [Flutter SDK Over-the-Counter](https://github.com/ihreapotheken/IA-SDK-Flutter) - `ia_over_the_counter` module
