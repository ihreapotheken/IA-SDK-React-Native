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

## Available Methods

```typescript
await cardLinkModule.launch({
  sdkApiKey, flowType: IaCardLinkFlowType.CardLink, pharmacyId, consentStatus, phoneNumber, userId,
  environment: IaCardLinkEnvironment.Debug,          // default: the SDK environment
  illustrationColor: IaCardLinkIllustrationColor.Blue, // Android
  supportsLiquidGlass: true,                          // iOS
});

await cardLinkModule.getVersion();
await cardLinkModule.getEnvironment();
await cardLinkModule.getLogFilePath();
await cardLinkModule.setHostAppLogFilePath('/path/to/host.log');

const cards = await cardLinkModule.getSavedCardList(userId); // or getSavedCards(userId) as JSON
await cardLinkModule.deleteCard(userId, 'My card');
await cardLinkModule.deleteAllCards();
await cardLinkModule.deleteAllUserRelatedData();
await cardLinkModule.updateCard({ userId, originalName, name, phoneNumber, canCode }); // Android
await cardLinkModule.reorderSavedCards(userId, orderedCanCodes);                      // Android
await cardLinkModule.setMocks({ isMockingEnabled: true });                             // iOS
await cardLinkModule.finish();                                                         // iOS

// Listeners
cardLinkModule.addEventListener((event) => {}); // willExit, cardSaved, failedToInitialize, ...
cardLinkModule.addConsentEventListener((event) => {});
cardLinkModule.addConsentPhoneNumberListener((phoneNumber) => {}); // iOS
cardLinkModule.addSessionCreatedListener((session) => {});
cardLinkModule.addPrescriptionsRedeemedListener((json) => {});
cardLinkModule.addSavedCardsListener((cards) => {});
cardLinkModule.addInitializationErrorListener((message) => {}); // iOS
cardLinkModule.addResultListener((result) => {});               // Android
cardLinkModule.addAnalyticsEventListener((eventName) => {});
```
