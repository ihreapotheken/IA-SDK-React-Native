# @ihreapotheken/ia-sdk-interface

Shared TypeScript interface definitions for the ia.de AppSDK React Native service.

## Implementation

For AppSDK usage, see the main [README.md](https://ihreapotheken.github.io/docs/appsdk/react-native) file.

API reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## Installation

```sh
npm install @ihreapotheken/ia-sdk-interface@VERSION
```

## Exports

This package provides TypeScript type definitions used across all SDK modules:

### Enums

- `IaBaseModule` - SDK module identifiers
- `ServerEnvironment` - Server environment configuration
- `Salutation` - Customer salutation options

### Interfaces

- `InitConfig` - SDK initialization configuration
- `GuestUserData` - Guest user data for checkout
- `TransferPrescriptionsParams` - Parameters for prescription transfer
- `CartState` - Shopping cart state
- `TransactionSignatures` - Completed order information

### Module Interfaces

- `IaModule` - Base interface for all modules
- `IaCardLinkModule` - CardLink module interface
- `IaOrderingModule` - Ordering module interface
- `IaOverTheCounterModule` - OTC module interface
- `IaPharmacyModule` - Pharmacy module interface
- `IaPrescriptionModule` - Prescription module interface

## Note

This package is a peer dependency of all other SDK packages and is automatically installed when using `@ihreapotheken/ia-sdk-core`.
