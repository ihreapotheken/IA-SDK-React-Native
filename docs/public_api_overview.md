# Public API Overview

This document provides a short overview of everything available to the host app. For details, see the
[API reference](https://ihreapotheken.github.io/docs/appsdk/react-native).

Functions marked iOS only or Android only log a warning and do nothing on the other platform. Callbacks and listeners
marked this way are never called on the other platform.

## @ihreapotheken/ia-sdk-core

### Setup and initialization
- `iaSdk.register(modules)` - Registers the module packages you use
- `iaSdk.initialize(config)` - Initializes the SDK, see [Initialization](initialization.md)
- `InitConfig` - Configuration passed to `initialize` (accessKey, clientId, etc.)
- `iaSdk.getInitializationState()` - Returns the current initialization state
- `iaSdk.isInitialized()` - Returns whether the SDK is initialized
- `iaSdk.addInitializationStateListener(callback)` - Listener for initialization state changes
- `iaSdk.getEnvironment()` - Returns the current server environment
- `iaSdk.cleanCache(initialization, prerequisites)` - Clears cached initialization and prerequisites data (iOS only)

### Module accessors
- `iaSdk.getModule(type)` - Returns a registered module, e.g. `iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy)`
- `iaSdk.hasModule(type)` - Returns whether a module is registered

### Prerequisites
- `iaSdk.launchPrerequisiteFlow()` - Runs the prerequisites explicitly (optional)
- `iaSdk.isPrerequisiteFlowCompleted()` - Returns whether the prerequisites are completed
- `iaSdk.resetPrerequisites()` - Resets the prerequisites, including the selected pharmacy
- `iaSdk.resetLegalDisclaimer()` - Resets the accepted legal documents (iOS only)
- `iaSdk.resetAnalyticsConsent()` - Resets the user's analytics consent answer
- `iaSdk.setIsOnboardingShown(isOnboardingShown)` - Sets whether onboarding was shown (iOS only)

### Screens
- `iaSdk.startDashboardActivity()` - Shows the [Start Screen](screens/start_screen.md)
- `iaSdk.launchApofinder({ isCancellable })` - Shows the [Apofinder Screen](screens/apofinder_screen.md)
- `iaSdk.finishAllActivities()` - Closes all SDK screens
- `IaSdkScreenView` - Shows an SDK screen in your own UI, e.g. in a tab, see [Presentation](presentation.md)
- `IaSdkPlatformView` - Shows an SDK component by its `viewId`; the component views build on it

### User data
- `iaSdk.setGuestUserData(data)` - Sets the user's personal data, used in checkout
- `iaSdk.setUserBillingAddress(address)` - Sets the billing address, used in checkout
- `iaSdk.setUserDeliveryAddress(address)` - Sets the delivery address, used in checkout
- `iaSdk.clearUserBillingAddress()` - Removes the billing address
- `iaSdk.clearUserDeliveryAddress()` - Removes the delivery address
- `iaSdk.logout()` - Resets the user data and the prerequisites
- `iaSdk.deleteUser()` - Deletes the user data stored on the device (iOS only)
- `iaSdk.getUserId()` - Returns the SDK's identifier for the current user (iOS only)

### Settings
- `iaSdk.setShouldShowMascotIllustrations(shouldShowMascotIllustrations)` - Shows or hides the mascot illustrations (iOS only)
- `iaSdk.setHapticFeedbackEnabled(isEnabled)` - Turns haptic feedback on or off (Android only)

### Callbacks and listeners
See [SDK Interaction](interaction.md).
- `iaSdk.onSdkWillNavigateToTarget` - Lets your app handle SDK navigation, e.g. to the cart
- `iaSdk.addApofinderPharmacyChangedListener(callback)` - Listener for pharmacies the user selects in Apofinder
- `iaSdk.onSdkBackAction` - Decides whether an SDK screen may close on back (Android only)
- `iaSdk.addAnalyticsEventListener(callback)` - Listener for analytics events logged for the host app

### Debugging
- `iaSdk.presentLogs()` - Shows the SDK's log viewer
- `iaSdk.exportLogs()` - Writes the SDK's logs to a file and returns its path (Android only)
- `iaSdk.addLogMessageListener(callback)` - Listener for SDK log messages (iOS only)
- `iaSdk.removeAllCachedResponses()` - Removes the cached images (iOS only)

## @ihreapotheken/ia-sdk-over-the-counter

- `IaModuleOverTheCounter` - The module, pass it to `register`
- `launchProductSearchRoute(options)` - Shows the [Product Search Screen](screens/product_search_screen.md)
- `clearProductGridCache()` - Clears the cached products of product grids (iOS only)
- `IaProductGrid` - Inline component that shows a grid of products, see [IaProductGrid](components/product_grid.md)

## @ihreapotheken/ia-sdk-ordering

- `IaModuleOrdering` - The module, pass it to `register`
- `launchCartScreen()` - Shows the [Cart Screen](screens/cart_screen.md)
- `transferPrescriptions(...)` - Adds prescription images, PDFs or eRezept codes to the cart
- `clearCart()` - Removes all products and prescriptions from the cart
- `getCartDetails(options)` - Returns the current cart details (iOS only)
- `getCartState(options)` - Returns the current cart state (iOS only)
- `deleteOrderHistory()` - Deletes the order history (iOS only)
- `addCartUpdatedListener(callback)` - Listener for cart updates
- `addOrderFinishedListener(callback)` - Listener for finished orders
- `IaCartButton` - Inline component, a button with the number of items in the cart that opens the cart, see [IaCartButton](components/cart_button.md)

## @ihreapotheken/ia-sdk-pharmacy

- `IaModulePharmacy` - The module, pass it to `register`
- `launchPharmacyDetails()` - Shows the [Pharmacy Screen](screens/pharmacy_screen.md)
- `setPharmacyId(pharmacyId)` - Sets the pharmacy, after `initialize`
- `savePharmacyId(pharmacyId)` - Saves the pharmacy without loading it, before `initialize` (iOS only)
- `getPharmacyId()` - Returns the selected pharmacy ID
- `clearPharmacyId()` - Clears the selected pharmacy and empties the cart
- `getPharmacy(options)` - Returns the details of the selected pharmacy (iOS only)

## @ihreapotheken/ia-sdk-prescription

- `IaModulePrescription` - The module, pass it to `register`
- `launchRedeemPrescriptionScreen()` - Shows the [Redeem Prescription Screen](screens/redeem_prescription_screen.md)
- `launchPrescriptionScanner(type)` - Shows the [Prescription Scanner Screen](screens/prescription_scanner_screen.md) (iOS only)
- `setScannerCameraState(state)` - Controls the scanner's camera and flashlight (iOS only)
- `addScannerCameraErrorListener(callback)` - Listener for scanner camera errors (iOS only)
- `onPrescriptionPhotoScanned` - Lets your app take over a photographed prescription
- `onEPrescriptionScanned` - Lets your app take over a scanned e-prescription

## @ihreapotheken/ia-sdk-cardlink

- `IaModuleCardLink` - The module, pass it to `register`
- `launch(options)` - Starts a CardLink flow
- `finish()` - Finishes the active CardLink session (iOS only)
- `getSavedCardList(userId)` - Returns the user's saved cards
- `getSavedCards(userId)` - Returns the user's saved cards as JSON
- `deleteCard(userId, cardName)` - Deletes a saved card
- `updateCard(params)` - Replaces the details of a saved card (Android only)
- `reorderSavedCards(...)` - Changes the order of saved cards (Android only)
- `deleteAllCards()` - Deletes all saved cards
- `deleteAllUserRelatedData()` - Deletes all CardLink user data
- `getVersion()` - Returns the CardLink SDK version
- `getEnvironment()` - Returns the CardLink environment
- `getLogFilePath()` - Returns the path of the CardLink log file
- `setHostAppLogFilePath(path)` - Sets your app's log file, attached to CardLink problem reports
- `setMocks(mocks)` - Simulates CardLink backend responses, for testing (iOS only)
- `addEventListener(callback)` - Listener for CardLink events
- `addConsentEventListener(callback)` - Listener for consent accepted or declined events
- `addSessionCreatedListener(callback)` - Listener for created CardLink sessions
- `addPrescriptionsRedeemedListener(callback)` - Listener for redeemed prescriptions
- `addSavedCardsListener(callback)` - Listener for saved cards
- `addAnalyticsEventListener(callback)` - Listener for CardLink analytics events
- `addConsentPhoneNumberListener(callback)` - Listener for the phone number entered with the consent (iOS only)
- `addInitializationErrorListener(callback)` - Listener for CardLink initialization errors
- `addResultListener(callback)` - Listener for CardLink results (Android only)
