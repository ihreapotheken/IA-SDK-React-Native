# @ihreapotheken/ia-sdk-pharmacy

AppSDK Pharmacy service for pharmacy details and management.

## Implementation

For AppSDK usage, see the main [README.md](https://ihreapotheken.github.io/docs/appsdk/react-native) file.

API reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## Installation

```sh
# Configure the GitHub Package Registry in .npmrc:
# @ihreapotheken:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

npm install @ihreapotheken/ia-sdk-core@VERSION
npm install @ihreapotheken/ia-sdk-pharmacy@VERSION
```

## Usage

The module should be instantiated, after which it must be forwarded to the `iaSdk.register` method for runtime configuration:

```typescript
import { iaSdk, ServerEnvironment, IaBaseModule } from '@ihreapotheken/ia-sdk-core';
import type { IaPharmacyModule } from '@ihreapotheken/ia-sdk-interface';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';

const pharmacyModule = new IaModulePharmacy();

async function initSdk() {
  await iaSdk.register([
    pharmacyModule,
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
const pharmacy = iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);

// Launch pharmacy details screen
await pharmacy.launchPharmacyDetails();

// Set a specific pharmacy by ID
await pharmacy.setPharmacyId('pharmacy-123');
```

## Related

- [Flutter SDK Pharmacy](https://github.com/ihreapotheken/IA-SDK-Flutter) - `ia_pharmacy` module
