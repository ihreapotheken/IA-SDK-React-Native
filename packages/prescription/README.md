# @ihreapotheken/ia-sdk-prescription

AppSDK Prescription service for prescription scanning and management.

## Implementation

For AppSDK usage, see the main [README.md](https://ihreapotheken.github.io/docs/appsdk/react-native) file.

API reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## Installation

```sh
# Configure the GitHub Package Registry in .npmrc:
# @ihreapotheken:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

npm install @ihreapotheken/ia-sdk-core@VERSION
npm install @ihreapotheken/ia-sdk-prescription@VERSION
```

## Usage

The module should be instantiated, after which it must be forwarded to the `iaSdk.register` method for runtime configuration:

```typescript
import { iaSdk, ServerEnvironment } from '@ihreapotheken/ia-sdk-core';
import { IaModulePrescription } from '@ihreapotheken/ia-sdk-prescription';

const prescriptionModule = new IaModulePrescription();

async function initSdk() {
  await iaSdk.register([
    prescriptionModule,
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

The Prescription module enables prescription scanning and management functionality. Once registered, the functionality is accessible through the SDK dashboard:

```typescript
// Access prescription features through the dashboard
await iaSdk.startDashboardActivity();
```

## Related

- [Flutter SDK Prescription](https://github.com/ihreapotheken/IA-SDK-Flutter) - `ia_prescription` module
