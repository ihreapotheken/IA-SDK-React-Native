# @ihreapotheken/ia-sdk-core

Core SDK functionality for the ia.de AppSDK React Native service.

## Implementation

For AppSDK usage, see the main [README.md](https://ihreapotheken.github.io/docs/appsdk/react-native) file.

API reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## Installation

```sh
# Configure the GitHub Package Registry in .npmrc:
# @ihreapotheken:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

npm install @ihreapotheken/ia-sdk-core@VERSION
```

## Usage

The core package provides the main SDK singleton and must be initialized before using any modules:

```typescript
import { iaSdk, ServerEnvironment } from '@ihreapotheken/ia-sdk-core';

// Register modules (from other packages)
await iaSdk.register([
  // Module instances...
]);

// Initialize the SDK
await iaSdk.initialize({
  accessKey: 'your-access-key',
  clientId: 'your-client-id',
  serverEnvironment: ServerEnvironment.Staging,
});
```

## Available Methods

### Module Management

- `iaSdk.register(modules)` - Register module instances for use
- `iaSdk.getModule<T>(type)` - Get a registered module by type
- `iaSdk.hasModule(type)` - Check if a module is registered

### SDK Operations

- `iaSdk.initialize(config)` - Initialize the SDK with credentials
- `iaSdk.startDashboardActivity()` - Launch the SDK dashboard
- `iaSdk.logout()` - Reset user data and onboarding status
- `iaSdk.setGuestUserData(data)` - Set guest checkout information
- `iaSdk.finishAllActivities()` - Close all SDK screens

## Re-exported Types

This package re-exports commonly used types from `@ihreapotheken/ia-sdk-interface`:

- `IaBaseModule`, `ServerEnvironment`, `Salutation` (enums)
- `IaModule`, `InitConfig`, `GuestUserData` (interfaces)
- Module interfaces for type-safe `getModule()` calls
