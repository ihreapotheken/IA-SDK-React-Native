# @ihreapotheken/ia-sdk-cardlink

AppSDK CardLink service for NFC-based prescription transfer.

## Implementation

For AppSDK usage, see the main [README.md](https://ihreapotheken.github.io/docs/appsdk/react-native) file.

API reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## Installation

```sh
# Configure the GitHub Package Registry in .npmrc:
# @ihreapotheken:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

npm install @ihreapotheken/ia-sdk-core@VERSION
npm install @ihreapotheken/ia-sdk-cardlink@VERSION
```

## Usage

The module should be instantiated, after which it must be forwarded to the `iaSdk.register` method for runtime configuration:

```typescript
import { iaSdk, ServerEnvironment } from '@ihreapotheken/ia-sdk-core';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';

const cardLinkModule = new IaModuleCardLink();

async function initSdk() {
  await iaSdk.register([
    cardLinkModule,
    // Other modules...
  ]);

  await iaSdk.initialize({
    accessKey: 'your-access-key',
    clientId: 'your-client-id',
    serverEnvironment: ServerEnvironment.Staging,
  });
}
```

## Functionality

The CardLink module enables NFC-based prescription transfer using the German health card (eGK). Once registered, the functionality is accessible through the SDK dashboard:

```typescript
// Access CardLink through the dashboard
await iaSdk.startDashboardActivity();
```

## Related

- [Flutter SDK CardLink](https://github.com/ihreapotheken/IA-SDK-Flutter) - `ia_cardlink` module
