/**
 * Shared interface definitions for the ia.de AppSDK React Native service.
 *
 * Methods documented as "iOS only" or "Android only" log a warning and do
 * nothing on the other platform (getters resolve with `null`). Listeners with
 * such a note never fire on the other platform.
 *
 * Failed calls reject with an `Error` whose `code` property names the failure:
 * `ARG_ERROR` for invalid arguments, `SDK_NOT_INITIALIZED` for calls the
 * Android SDK can't handle before `initialize`, `NO_ACTIVITY` when an Android
 * call needs an activity, and otherwise a code naming the method, for example
 * `CLEAR_CART_ERROR`.
 */

/**
 * SDK modules that can be registered for use in the application.
 * Each module provides specific functionality within the ia.de SDK.
 */
export enum IaBaseModule {
  /** Over-the-counter product browsing and purchasing functionality. */
  OverTheCounter = 'overTheCounter',
  /** Order management and checkout functionality. */
  Ordering = 'ordering',
  /** Detailed pharmacy information display. */
  Pharmacy = 'pharmacy',
  /** Prescription management functionality including scanning and uploading. */
  Prescription = 'prescription',
  /** CardLink (NFC) prescription transfer functionality. */
  CardLink = 'cardLink',
}

/**
 * Handle returned by the `add…Listener` methods.
 */
export interface IaSdkSubscription {
  /** Removes the listener. */
  remove(): void;
}

// ============================================================================
// CardLink Types
// ============================================================================

/**
 * Flow type for CardLink operations.
 */
export enum IaCardLinkFlowType {
  /** Main NFC scanning flow for prescription transfer. */
  CardLink = 'launchCardLinkSdk',
  /** Saved cards management view. */
  SavedCards = 'launchCardLinkCards',
}

/**
 * Consent status for CardLink operations.
 */
export enum IaCardLinkConsentStatus {
  /** Show consent screen to user. */
  ShowConsent = 'SHOW_CONSENT',
  /** User has previously accepted consent. */
  ConsentAccepted = 'CONSENT_ACCEPTED',
  /** User has previously declined consent. */
  ConsentDeclined = 'CONSENT_DECLINED',
}

/**
 * Consent event types emitted by CardLink.
 */
export enum IaCardLinkConsentEvent {
  /** User accepted consent. */
  Accepted = 'accepted',
  /** User declined consent. */
  Declined = 'declined',
}

/**
 * Lifecycle events emitted by CardLink.
 */
export enum IaCardLinkEvent {
  /**
   * CardLink has closed. On Android it's reported once the last CardLink
   * screen has closed.
   */
  WillExit = 'willExitCardlink',
  /** NFC scanning is about to start. Only reported on iOS. */
  WillStartScanning = 'willStartScanning',
  /**
   * CardLink failed to initialize. The reason is reported through
   * `addInitializationErrorListener`.
   */
  FailedToInitialize = 'failedToInitialize',
  /** User requested to navigate to cart. Only reported on Android. */
  GoToCart = 'goToCart',
  /** User requested to view terms and conditions. */
  OpenTermsAndConditions = 'openTermsAndConditions',
  /**
   * Insurance card was saved successfully. The saved cards are reported
   * through `addSavedCardsListener`.
   */
  CardSaved = 'cardSaved',
  /**
   * CardLink closed with a result, reported through `addResultListener`.
   * Only reported on Android.
   */
  Finished = 'cardLinkResult',
}

/**
 * Environment configuration for CardLink SDK.
 */
export enum IaCardLinkEnvironment {
  /** Debug/QA environment. */
  Debug = 'DEBUG',
  /** Production environment. */
  Production = 'PRODUCTION',
}

/**
 * Finish action for CardLink operations.
 * Determines what happens with prescriptions after NFC scanning.
 */
export enum IaCardLinkFinishAction {
  /** Send raw prescriptions data to the host app. */
  SendRawPrescriptions = 'sendRawPrescriptions',
  /** Upload prescriptions to the backend. */
  UploadPrescriptions = 'uploadPrescriptions',
}

/**
 * Color of the illustrations in CardLink screens. Only used on Android.
 */
export enum IaCardLinkIllustrationColor {
  Red = 'RED',
  Blue = 'BLUE',
  Pink = 'PINK',
  Green = 'GREEN',
  Orange = 'ORANGE',
  Yellow = 'YELLOW',
  Purple = 'PURPLE',
}

/**
 * Session information from CardLink.
 */
export interface IaCardLinkSession {
  /** Unique session identifier. */
  cardSessionId: string;
  /** Session expiration timestamp (Unix epoch milliseconds). */
  sessionExpireTimestamp: number;
}

/**
 * A saved CardLink card (CAN code).
 */
export interface IaCardLinkSavedCard {
  /** User-defined name for the saved card. */
  name: string;
  /** The CAN code associated with this card. */
  canCode?: string | null;
  /** Identifier of the saved card. Only reported on iOS. */
  id?: string | null;
  /** Phone number linked to the saved card. */
  phoneNumber?: string | null;
}

/**
 * Launch configuration options for CardLink.
 */
export interface IaCardLinkLaunchOptions {
  /** SDK API key for authentication. */
  sdkApiKey: string;
  /** Flow type to launch. */
  flowType: IaCardLinkFlowType;
  /** Pharmacy identifier. */
  pharmacyId: string;
  /** Consent status to display. */
  consentStatus: IaCardLinkConsentStatus;
  /** User's phone number. */
  phoneNumber: string;
  /** User identifier for card storage. */
  userId: string;
  /** Optional CAN code (6 digits). */
  canCode?: string;
  /**
   * Optional name of a saved card to start with. It must match one of the
   * user's saved cards; leave it unset to scan a new card. On Android a set
   * name always starts with a saved card, so CardLink skips the consent screen
   * and never offers to save the card.
   */
  cardName?: string;
  /**
   * Primary UI color (ARGB integer). On iOS the colors replace the SDK-wide
   * palette until CardLink closes.
   */
  primaryColor?: number;
  /** Buttons UI color (ARGB integer). */
  buttonsColor?: number;
  /** Text link UI color (ARGB integer). */
  textLinkColor?: number;
  /** Bottom navigation UI color (ARGB integer). */
  bottomNavigationColor?: number;
  /**
   * SDK environment. When not set, the environment `iaSdk` was initialized
   * with is used. On iOS, setting it also switches the environment of the
   * whole SDK.
   */
  environment?: IaCardLinkEnvironment;
  /**
   * Enables saving the scanned card. Defaults to `true`. CardLink only offers
   * it when card saving is also enabled in the CMS, and on Android only
   * without `cardName`.
   */
  saveCardEnabled?: boolean;
  /**
   * Finish action determining what happens with prescriptions after NFC
   * scanning. Only used on iOS; Android always only reports them.
   */
  finishAction?: IaCardLinkFinishAction;
  /**
   * Application ID (Android `applicationId`, iOS SDK-wide App Store ID).
   */
  appId?: string;
  /**
   * File path of the host app's log file that users can attach to problem
   * reports. Stays set after CardLink closes.
   */
  coreAppLogFileURL?: string;
  /**
   * Enables the Liquid Glass UI style. Only used on iOS, where it changes the
   * setting for all SDK screens.
   */
  supportsLiquidGlass?: boolean;
  /** Color of the CardLink illustrations. Only used on Android. */
  illustrationColor?: IaCardLinkIllustrationColor;
}

/**
 * Parameters for updating a saved card (Android only).
 */
export interface IaCardLinkUpdateCardParams {
  /** User identifier. */
  userId: string;
  /** Current name of the card to update. */
  originalName: string;
  /** New name of the card. */
  name: string;
  /** Phone number linked to the card. */
  phoneNumber: string;
  /** CAN code of the card. */
  canCode: string;
}

/** Simulated response to CardLink session creation. */
export enum IaCardLinkSessionMockResponse {
  Auto = 'auto',
  ResumeSession = 'resumeSession',
  VerificationNeeded = 'verificationNeeded',
  WrongPhoneNumber = 'wrongPhoneNumber',
  ServiceNotAvailable = 'serviceNotAvailable',
  OtherError = 'otherError',
}

/** Simulated response to the SMS code verification. */
export enum IaCardLinkVerificationMockResponse {
  Success = 'success',
  WrongOtp = 'wrongOtp',
  ExpiredOtp = 'expiredOtp',
  MaxAttemptsReached = 'maxAttemptsReached',
  OtherError = 'otherError',
}

/**
 * Simulated CardLink backend responses, for testing CardLink flows without a
 * health card (iOS only).
 */
export interface IaCardLinkMocks {
  /** Whether the mocks are used. Defaults to `true`. */
  isMockingEnabled?: boolean;
  /** Response to session creation. Defaults to `auto`. */
  sessionResponse?: IaCardLinkSessionMockResponse;
  /** Duration of a mocked session in seconds. */
  sessionDurationSeconds?: number;
  /** Seconds before the end of a mocked session it counts as expiring soon. */
  sessionWillExpireSoonSeconds?: number;
  /** Response to the SMS code verification. Defaults to `success`. */
  verificationResponse?: IaCardLinkVerificationMockResponse;
  /** E-prescription XML documents returned instead of the card's ones. */
  ePrescriptionXmls?: string[];
  /** Whether only some of `ePrescriptionXmls` are returned. */
  arePrescriptionsPartiallyMocked?: boolean;
  /** Whether scanning reports a wrong CAN. */
  isWrongCanMocked?: boolean;
}

/**
 * Subscription handle for CardLink event listeners.
 */
export type IaCardLinkEventSubscription = IaSdkSubscription;

// ============================================================================
// Core Types
// ============================================================================

/**
 * Server environment configuration for the ia.de services.
 */
export enum ServerEnvironment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

/**
 * Customer salutation options.
 *
 * Values are matched case-insensitively; unknown values are stored as
 * "Keine Angabe".
 */
export enum Salutation {
  Male = 'Herr',
  Female = 'Frau',
  Diverse = 'Divers',
  NotDisclosed = 'Keine Angabe',
}

/**
 * Initialization state of the SDK.
 */
export enum IaSdkInitializationState {
  Uninitialized = 'uninitialized',
  Initializing = 'initializing',
  Initialized = 'initialized',
  Error = 'error',
}

/**
 * Destinations the SDK asks the host app about before navigating, see
 * `iaSdk.onSdkWillNavigateToTarget`.
 */
export enum IaSdkNavigationTarget {
  Cart = 'cart',
  PharmacyDetails = 'pharmacyDetails',
  ThankYou = 'thankYou',
  /** The imprint footer button. On Android only with `footer.isImprintHandledByHostApp`. */
  Imprint = 'imprint',
  Apofinder = 'apofinder',
  /** Only reported on Android. */
  Start = 'start',
  /** Only reported on Android. */
  Search = 'search',
  /** Only reported on Android. */
  RedeemPrescription = 'redeemPrescription',
  /** Only reported on Android. */
  ThankYouCompleted = 'thankYouCompleted',
}

/**
 * SDK screens that can be embedded in the app's own view hierarchy with
 * `IaSdkScreenView`, instead of being launched on top of it.
 */
export enum IaSdkScreenViewId {
  /** The SDK's start screen (dashboard). */
  StartScreen = 'startScreen',
  /** Product search (over-the-counter module). */
  SearchScreen = 'searchScreen',
  /** The cart (ordering module). */
  CartScreen = 'cartScreen',
  /** Pharmacy details (pharmacy module). */
  PharmacyScreen = 'pharmacyScreen',
  /** Apofinder (pharmacy selection). */
  ApofinderScreen = 'apofinderScreen',
  /** Redeem prescription (prescription module). */
  RedeemPrescription = 'redeemPrescription',
}

/**
 * How the app shows an embedded SDK screen, which decides the button the SDK
 * puts in its navigation bar (iOS only). The Android SDK has no embed options:
 * there the screen shows no back or close button and the system back action
 * applies.
 */
export enum IaSdkScreenEmbedStyle {
  /** The app pushed the screen; the SDK shows a back button. */
  Navigation = 'navigation',
  /** The app presented the screen; the SDK shows a close button. */
  Presentation = 'presentation',
}

/**
 * Options of the prerequisites flow (legal documents, onboarding, pharmacy
 * selection).
 */
export interface IaPrerequisitesConfiguration {
  /** Whether the user can cancel the flow (iOS). Defaults to `true`. */
  isCancellable?: boolean;
  /** Whether the flow is presented animated (iOS). Defaults to `true`. */
  isAnimated?: boolean;
  /** Whether the legal documents are shown when needed. Defaults to `true`. */
  runLegalIfNeeded?: boolean;
  /** Whether the onboarding is shown when needed. Defaults to `false`. */
  runOnboardingIfNeeded?: boolean;
  /** Whether Apofinder is shown when no pharmacy is selected. Defaults to `true`. */
  runApofinderIfNeeded?: boolean;
}

/**
 * Initialization behavior options.
 */
export interface IaInitializationConfiguration {
  /** Whether a loading indicator is shown while initializing. Defaults to `false`. */
  shouldShowIndicator?: boolean;
  /** Prerequisites flow options. */
  prerequisites?: IaPrerequisitesConfiguration;
}

/**
 * Footer buttons of the SDK screens.
 */
export interface IaFooterConfiguration {
  /** Shows the app settings button (iOS). Defaults to `true`. */
  shouldShowAppSettings?: boolean;
  /** Shows the imprint button (iOS). Defaults to `true`. */
  shouldShowImprint?: boolean;
  /**
   * Whether the host app shows the imprint. The SDK then reports the imprint
   * button through `onSdkWillNavigateToTarget` instead of opening its own
   * page (Android). Defaults to `false`.
   */
  isImprintHandledByHostApp?: boolean;
}

/** Header style of the SDK screens. */
export enum IaHeaderStyle {
  Duotone = 'duotone',
  Monotone = 'monotone',
}

/** Header appearance. Colors are ARGB integers, e.g. `0xFF1E88E5`. */
export interface IaHeaderConfiguration {
  style?: IaHeaderStyle;
  primaryColor?: number;
  secondaryColor?: number;
}

/** Button appearance. Colors are ARGB integers, e.g. `0xFF1E88E5`. */
export interface IaButtonConfiguration {
  backgroundColor?: number;
  backgroundDisabledColor?: number;
  textColor?: number;
  textDisabledColor?: number;
  borderColor?: number;
  borderDisabledColor?: number;
  borderWidth?: number;
  borderRadius?: number;
}

/** UI appearance of the SDK screens. */
export interface IaUIConfiguration {
  /** Enables the Liquid Glass style (iOS). Defaults to `false`. */
  supportsLiquidGlass?: boolean;
  /** Shows the Pharmi mascot illustrations. Defaults to `true`. */
  shouldShowMascotIllustrations?: boolean;
  header?: IaHeaderConfiguration;
  primaryButton?: IaButtonConfiguration;
  secondaryButton?: IaButtonConfiguration;
}

/** QA features for testing an integration (iOS). */
export enum IaSdkQaFeature {
  EasyLogsAccessInProduction = 'easyLogsAccessInProduction',
  ForceRefreshCartScreenButton = 'forceRefreshCartScreenButton',
  PharmacyPCasesInfoButton = 'pharmacyPCasesInfoButton',
  LongPressProductInfo = 'longPressProductInfo',
  SdkInfoInNavigationBar = 'sdkInfoInNavigationBar',
  ShowInteractionWithRealPharmacyWarning = 'showInteractionWithRealPharmacyWarning',
  ShowPharmacyIdInputOnApofinder = 'showPharmacyIdInputOnApofinder',
  ImageViewerDebugDetails = 'imageViewerDebugDetails',
  ShowFailedScannedCodeInErrorMessage = 'showFailedScannedCodeInErrorMessage',
  EnableFirstResponderLogging = 'enableFirstResponderLogging',
  ShowLabTestActivationCodeDetails = 'showLabTestActivationCodeDetails',
}

/** Mocked SDK features (Android). */
export interface IaQaMockSdkFeatures {
  isExpressDeliveryEnabled?: boolean;
  isOnlinePaymentEnabled?: boolean;
  isTrackingEnabled?: boolean;
  isCardLinkEnabled?: boolean;
}

/** Mocked bundle permissions (Android). */
export interface IaQaMockBundlePermissions {
  isOverTheCounterEnabled?: boolean;
  isOrderingEnabled?: boolean;
  isPharmacyEnabled?: boolean;
  isPrescriptionEnabled?: boolean;
  isCardLinkEnabled?: boolean;
}

/** Mocked force update (Android). */
export interface IaQaMockForceUpdate {
  isHardUpdate?: boolean;
  minimumVersion?: string;
  message?: string;
  playStoreId?: string;
}

/**
 * QA options for testing an integration. Not meant for production builds.
 */
export interface IaQaConfiguration {
  /** Lists test pharmacies in Apofinder. Defaults to `false`. */
  showTestPharmaciesInApofinder?: boolean;
  /** QA features (iOS). */
  features?: IaSdkQaFeature[];
  /** Numeric pharmacy ID Apofinder offers (Android). */
  apofinderCustomPharmacyId?: string;
  /** Maximum scroll speed (Android). */
  maxScrollSpeed?: number;
  /** Mocked SDK features (Android). */
  mockSdkFeatures?: IaQaMockSdkFeatures;
  /** Mocked bundle permissions (Android). */
  mockBundlePermissions?: IaQaMockBundlePermissions;
  /** Mocked force update (Android). */
  mockForceUpdate?: IaQaMockForceUpdate;
}

/**
 * Configuration for CardLink flows the SDK starts itself, for example from
 * the redeem prescription screen.
 */
export interface IaCardLinkConfiguration {
  /** Whether CardLink offers to save the scanned card. */
  isSaveCardEnabled?: boolean;
  /** User identifier for card storage (iOS). */
  userId?: string;
  /** Phone number the SMS code is sent to (iOS). */
  phoneNumber?: string;
}

/**
 * Configuration for SDK initialization.
 */
export interface InitConfig {
  /** Authentication key used to identify the host app. */
  accessKey: string;
  /** Client identifier used for pharmacy selection services. */
  clientId: string;
  /** Specified server environment for the ia.de services. */
  serverEnvironment: ServerEnvironment;
  /** Apofinder channel identifier for pharmacy collection filtering. */
  channelId?: number;
  /** Whether the SDK should fetch the theme configuration from the remote server. Defaults to false. */
  shouldFetchThemeFromRemote?: boolean;
  /** Footer buttons of the SDK screens. */
  footer?: IaFooterConfiguration;
  /** Initialization and prerequisites behavior. */
  initialization?: IaInitializationConfiguration;
  /** UI appearance of the SDK screens. */
  uiConfiguration?: IaUIConfiguration;
  /** Offers pickup lockers and courier shipping in checkout. */
  isPickupLockerAndCourierShippingEnabled?: boolean;
  /** App Store ID of the host app (iOS). */
  appStoreId?: string;
  /** Play Store ID of the host app (Android). */
  playStoreId?: string;
  /** Whether the SDK logs analytics events (Android). Defaults to the SDK default, on. */
  isAnalyticsEnabled?: boolean;
  /** Whether SDK screens use haptic feedback (Android). Defaults to `true`. */
  isHapticFeedbackEnabled?: boolean;
  /** QA options. Not meant for production builds. */
  qaConfiguration?: IaQaConfiguration;
  /** Configuration for CardLink flows the SDK starts itself. */
  cardLink?: IaCardLinkConfiguration;
  /** File path of the host app's log file users can attach to problem reports. */
  hostAppLogFilePath?: string;
}

/**
 * Guest user data for checkout purposes.
 */
export interface GuestUserData {
  /** Customer salutation/pronouns. */
  salutation: Salutation;
  /** First/personal customer name. */
  firstName: string;
  /** Last name or customer surname. */
  lastName: string;
  /** Email address used for communication purposes. */
  email: string;
  /** Phone number country code (e.g., 49). */
  phoneNumberCountryCode: number;
  /**
   * Phone number without country code. Pass a string to keep leading zeros.
   */
  phoneNumberWithoutCountryCode: string | number;
}

/**
 * User address used to pre-fill the checkout flow.
 *
 * Used by `setUserBillingAddress` and `setUserDeliveryAddress`.
 */
export interface UserAddress {
  /** First/personal customer name. */
  firstName: string;
  /** Last name or customer surname. */
  lastName: string;
  /** Optional additional address line (e.g., c/o, apartment). */
  additionalInfo?: string;
  /** Street name. */
  street: string;
  /** House number. */
  houseNumber: string;
  /** Postal/ZIP code. */
  zipCode: string;
  /** City. */
  city: string;
  /** Optional customer salutation. */
  salutation?: Salutation;
  /** Optional phone number country code (e.g., 49). */
  phoneNumberCountryCode?: number;
  /** Optional phone number without country code. */
  phoneNumberWithoutCountryCode?: string;
}

/**
 * Result of the prerequisites flow.
 */
export interface IaSdkPrerequisitesResult {
  /** Whether the user cancelled the flow. */
  isCancelled: boolean;
}

/**
 * Analytics event the SDK logged for the host app.
 */
export interface IaSdkLoggedAnalyticsEvent {
  /** Event name, see `IaSdkAnalyticsEventNames`. */
  name: string;
  /** Event parameters, see `IaSdkAnalyticsParameterNames`. */
  parameters: { [key: string]: unknown };
}

/**
 * Event names of `IaSdkLoggedAnalyticsEvent.name`. New events are added over
 * time, so code that switches over names needs a default case.
 */
export const IaSdkAnalyticsEventNames = {
  /** An SDK screen appeared. Parameter: `screen_name`. */
  screenView: 'screen_view',
  /** A product went into the cart, or its quantity went up. */
  addToCart: 'add_to_cart',
  /** Products left the cart, or a quantity went down. */
  removeFromCart: 'remove_from_cart',
  /** An order was placed. Parameters: `transaction_id`, `client_order_id`. */
  purchase: 'purchase',
  /** A pharmacy was set. Parameters: `pharmacy_id`, `pharmacy_name`. */
  pharmacySelected: 'pharmacy_selected',
  /** A prescription went into the cart. Parameters: `prescription_type`, `method`. */
  prescriptionAdded: 'prescription_added',
  /** A prescription left the cart. Parameters: `prescription_type`, `reason`. */
  prescriptionRemoved: 'prescription_removed',
  /** A feature can't run on this device. Parameters: `feature`, `reason`. */
  featureUnavailable: 'feature_unavailable',
} as const;

/**
 * Parameter keys of `IaSdkLoggedAnalyticsEvent.parameters`.
 */
export const IaSdkAnalyticsParameterNames = {
  screenName: 'screen_name',
  transactionId: 'transaction_id',
  clientOrderId: 'client_order_id',
  pharmacyId: 'pharmacy_id',
  pharmacyName: 'pharmacy_name',
  prescriptionType: 'prescription_type',
  method: 'method',
  feature: 'feature',
  reason: 'reason',
} as const;

/**
 * Stable screen names reported as the `screen_name` parameter.
 */
export const IaSdkAnalyticsScreenNames = {
  start: 'start',
  search: 'search',
  productDetails: 'product_details',
  cart: 'cart',
  checkout: 'checkout',
  thankYou: 'thank_you',
  pharmacy: 'pharmacy',
  pharmacySearch: 'pharmacy_search',
  redeemPrescription: 'redeem_prescription',
} as const;

/**
 * Message the SDK logged (iOS only).
 */
export interface IaSdkLogMessage {
  /** The logged message. */
  message: string;
  /**
   * Log level: `debug`, `info`, `warning`, `error`, `userInteraction`,
   * `cameraError`, `httpClientInfo`, `httpClientSuccess`, `httpClientError`,
   * or the SDK's title of another level.
   */
  level: string;
}

/**
 * Pharmacy change reported by `addApofinderPharmacyChangedListener`.
 */
export interface IaApofinderPharmacyChange {
  /** Identifier of the selected pharmacy. */
  pharmacyId: string;
  /** Whether the pharmacy was selected in the prerequisites flow. */
  isFromPrerequisites: boolean;
}

// ============================================================================
// Ordering Types
// ============================================================================

/**
 * Insurance type classification for PDF prescriptions.
 */
export enum PrescriptionInsuranceType {
  /** Private health insurance prescription. */
  PrivateInsurance = 'privateInsurance',
  /** Public/statutory health insurance prescription. */
  PublicHealthcare = 'publicHealthcare',
}

/**
 * A PDF prescription with its associated insurance type.
 */
export interface PdfPrescription {
  /** Base64-encoded PDF data. */
  data: string;
  /** Insurance type for this PDF prescription. */
  insuranceType: PrescriptionInsuranceType;
}

/**
 * What the SDK shows once prescriptions were transferred.
 */
export enum IaTransferPrescriptionsFinishAction {
  /** Opens the cart. */
  OpenCart = 'openCart',
  /** Shows a confirmation sheet. */
  ShowBottomSheet = 'showBottomSheet',
  /** Shows nothing (iOS); on Android the SDK opens the cart. */
  NoAction = 'noAction',
}

/**
 * Parameters for transferring prescriptions.
 */
export interface TransferPrescriptionsParams {
  /** Base64-encoded images (JPG/PNG). */
  images?: string[] | null;
  /** PDF prescriptions with insurance type classification. */
  pdfs?: PdfPrescription[] | null;
  /** JSON-encoded eRezept codes. */
  codes?: string[] | null;
  /** Client order identifier for differentiating orders on checkout completion. */
  orderId?: string | null;
  /** What the SDK shows once the transfer is done. Defaults to `openCart`. */
  finishAction?: IaTransferPrescriptionsFinishAction;
  /** Whether a loading indicator is shown during the transfer (iOS). Defaults to `true`. */
  showActivityIndicator?: boolean;
}

/**
 * Product in the shopping cart.
 */
export interface CartProduct {
  /** Product identifier. */
  pzn: string;
  /** Number of units in the cart. */
  amount: number;
}

/**
 * State of the shopping cart.
 */
export interface CartState {
  /** Total number of items in cart (products + prescriptions, each unit counted individually). */
  totalAmountInCart: number;
  /** Array of external/client order IDs. Always empty on Android. */
  clientOrderIDs: string[];
  /** Number of products in the cart. Only reported on Android. */
  totalProducts?: number | null;
  /** Number of prescriptions in the cart. Only reported on Android. */
  totalPrescriptions?: number | null;
  /** Products in the cart. Only reported on iOS, `null` without cart details. */
  products?: CartProduct[] | null;
}

/**
 * Cart details returned by `getCartDetails` (iOS only).
 */
export interface CartDetails {
  /** Total number of items in cart. */
  totalAmountInCart: number;
  /** Products in the cart. */
  products: CartProduct[];
}

/**
 * Options of `getCartDetails` and `getCartState`.
 */
export interface CartDetailsOptions {
  /** Whether previously loaded details may be returned. Defaults to `true`. */
  allowCached?: boolean;
  /** Whether the result is also reported to the cart listeners. Defaults to `false`. */
  shouldEmitCartUpdate?: boolean;
}

/**
 * Information about a completed order.
 */
export interface TransactionSignatures {
  /** Order code from backend (the first of `orderCodes`). */
  orderCode: string;
  /** Order codes of all orders placed in the checkout. */
  orderCodes: string[];
  /** Order IDs provided by host app using transferPrescriptions. */
  clientOrderIDs: string[];
}

// ============================================================================
// Over-the-counter Types
// ============================================================================

/**
 * Product display type determining which product collection to show in
 * the [IaProductGrid] component.
 */
export enum IaProductDisplayType {
  /** Currently active pharmacy offers. */
  CurrentOffers = 'currentOffers',
  /** Monthly featured products. */
  ProductsOfTheMonth = 'productsOfTheMonth',
  /** Product recommendations based on a specific product (pzn). */
  ProductRecommendations = 'productRecommendations',
  /** Products that other customers also bought based on a specific product (pzn). */
  CustomersAlsoBought = 'customersAlsoBought',
  /** A custom list of products (`pzns`) with a `title`. */
  Custom = 'custom',
}

/**
 * Options of `launchProductSearchRoute`.
 */
export interface ProductSearchOptions {
  /** Whether the search field is focused when the screen opens (iOS). */
  focusesOnAppear?: boolean;
}

// ============================================================================
// Pharmacy Types
// ============================================================================

/** Opening hours of a part of a day, e.g. `{ start: '08:00', end: '12:00' }`. */
export interface IaPharmacyTimeOfDay {
  start: string;
  end: string;
}

/** Status text in several lengths. */
export interface IaPharmacyStatusContent {
  label: string | null;
  text: string | null;
}

/** Delivery prices. */
export interface IaPharmacyDeliveryPrice {
  cost: number | null;
  freeDeliveryMinimum: number | null;
  deliveryMinimum: number | null;
}

/** Delivery area limits. */
export interface IaPharmacyDeliveryLimit {
  zipCodes: string[];
  airDistance: number | null;
  streetDistance: number | null;
}

/**
 * Details of the selected pharmacy, returned by `getPharmacy` (iOS only).
 */
export interface IaPharmacy {
  id: number;
  pcases: string[];
  isEmergencyServiceOpen: boolean;
  isEmergencyServiceOffered: boolean;
  appointmentBookingServices: {
    allowsDisplayToCustomers: boolean;
    allowsVaccination: boolean;
    allowsPdl: boolean;
  } | null;
  pharmacyAdditionalName: string | null;
  additionalInformation: {
    apodeId: string;
    name: string;
    logo: string;
    slug: string;
    url: string;
    allowsPayments: boolean;
    offersVaccineBooking: boolean;
    allowsCouponing: boolean;
    isTestPharmacy: boolean;
  };
  contact: {
    phone: string;
    fax: string;
    email: string;
    websiteUrl: string;
    whatsAppMobilePhoneNumber: string | null;
  };
  location: {
    city: string;
    postcode: string;
    region: string;
    street: string;
    latitude: number;
    longitude: number;
  };
  businessHours: {
    isOpenNow: boolean;
    isOpenToday: boolean;
    isLunchBreakNow: boolean;
    status: {
      small: IaPharmacyStatusContent | null;
      medium: IaPharmacyStatusContent | null;
      large: IaPharmacyStatusContent | null;
    } | null;
    days: Array<{
      day: string;
      text: string;
      isToday: boolean;
      morning: IaPharmacyTimeOfDay | null;
      afternoon: IaPharmacyTimeOfDay | null;
    }>;
  };
  company: {
    name: string | null;
    legalEntity: string | null;
    owners: Array<{ name: string | null; title: string | null }> | null;
  };
  delivery: {
    standard: {
      enabled: boolean;
      freeDelivery: boolean;
      deliveryPeriod: string | null;
      prescriptionDelivery: boolean;
      freePrescriptionDelivery: boolean;
      deliveryByAgreement: boolean;
      deliveryTimes: Array<{
        day: string;
        /** ISO 8601 date. */
        date: string;
        value: string;
        timeFrom: string;
        timeTo: string;
        slotIsToday: boolean;
      }>;
      price: IaPharmacyDeliveryPrice | null;
      deliveryLimits: IaPharmacyDeliveryLimit | null;
      customTitle: string | null;
      customText: string | null;
    };
    express: {
      enabled: boolean;
      deliveryTime: string | null;
      inventoryType: string | null;
      price: IaPharmacyDeliveryPrice | null;
      deliveryLimits: IaPharmacyDeliveryLimit | null;
    };
    courierShipping: {
      enabled: boolean;
      websiteEnabled: boolean;
      wlaEnabled: boolean;
      price: IaPharmacyDeliveryPrice | null;
    } | null;
    pickupLocker: {
      enabled: boolean;
      websiteEnabled: boolean;
      wlaEnabled: boolean;
      acceptsPrescriptions: boolean;
      pickupDeadlineHours: number | null;
    } | null;
    showDimdiFooterLogo: boolean;
    dimdiLicenseUrl: string | null;
  };
  services: Array<{
    title: string;
    name: string;
    emphasized: boolean;
    descriptions: string[];
  }>;
  emergencyTimesMessages: {
    small: IaPharmacyStatusContent;
    medium: IaPharmacyStatusContent;
    large: IaPharmacyStatusContent;
  } | null;
  chatEnabled: boolean;
  channels: Array<{ id: number; linkToProfile: string }>;
}

// ============================================================================
// Prescription Types
// ============================================================================

/**
 * Scanner opened by `launchPrescriptionScanner`.
 */
export enum IaPrescriptionScannerType {
  /** Photo of a paper prescription. */
  Prescription = 'prescription',
  /** E-prescription (eRezept) QR code. */
  EPrescription = 'ePrescription',
}

/**
 * How the SDK continues after the host app received a scanned prescription.
 */
export type IaPrescriptionScanDecision =
  /** The SDK continues with its built-in handling. */
  | { decision: 'performDefault' }
  /** The host app has taken over; the scanner stays open and keeps scanning. */
  | { decision: 'handled' }
  /** The host app rejects the prescription; the SDK shows `message`. */
  | { decision: 'error'; message: string };

/**
 * E-prescription (eRezept) QR code the user scanned.
 */
export interface IaEPrescriptionScan {
  /** The scanned code. */
  rawCode: string;
  /** The prescription URLs in the code. */
  urls: string[];
}

/**
 * Camera state of the scanner opened by `launchPrescriptionScanner`.
 * Unset values stay unchanged.
 */
export interface IaScannerCameraState {
  isOn?: boolean;
  isFlashlightOn?: boolean;
  isPreviewPaused?: boolean;
}

// ============================================================================
// Module interfaces
// ============================================================================

/**
 * Base interface for all SDK modules.
 */
export interface IaModule {
  /** The type of module this instance represents. */
  readonly moduleType: IaBaseModule;
  /** Register the module with the native side. */
  register(): Promise<void>;
}

/**
 * Interface for the CardLink module.
 * Provides NFC-based prescription transfer functionality.
 */
export interface IaCardLinkModule extends IaModule {
  readonly moduleType: IaBaseModule.CardLink;

  /**
   * Launches the CardLink flow with the specified configuration.
   * @param options - Launch configuration options.
   */
  launch(options: IaCardLinkLaunchOptions): Promise<void>;

  /**
   * Gets the CardLink SDK version.
   * @returns The SDK version string, or null if unavailable.
   */
  getVersion(): Promise<string | null>;

  /**
   * Gets the current CardLink SDK environment. Before the first launch, this
   * is the environment `iaSdk` was initialized with.
   */
  getEnvironment(): Promise<IaCardLinkEnvironment>;

  /**
   * Gets the path to the CardLink SDK log file.
   * @returns The log file path, or null if unavailable.
   */
  getLogFilePath(): Promise<string | null>;

  /**
   * Gets saved insurance cards for a user as JSON. Rejects when the stored
   * cards can't be read.
   * @param userId - The user identifier.
   */
  getSavedCards(userId: string): Promise<string | null>;

  /**
   * Gets the saved insurance cards for a user, parsed from `getSavedCards`.
   * @param userId - The user identifier.
   */
  getSavedCardList(userId: string): Promise<IaCardLinkSavedCard[]>;

  /**
   * Deletes a specific saved card.
   * @param userId - The user identifier.
   * @param cardName - The card name to delete.
   */
  deleteCard(userId: string, cardName: string): Promise<void>;

  /**
   * Replaces the details of a saved card (Android only).
   */
  updateCard(params: IaCardLinkUpdateCardParams): Promise<void>;

  /**
   * Changes the order of the saved cards (Android only).
   * @param userId - The user identifier.
   * @param orderedCanCodes - CAN codes of the saved cards, in the new order.
   */
  reorderSavedCards(userId: string, orderedCanCodes: string[]): Promise<void>;

  /**
   * Deletes all saved cards.
   * @returns On iOS "successDeleteAll" or "emptyStorage". On Android all
   * CardLink data is cleared and null is returned.
   */
  deleteAllCards(): Promise<string | null>;

  /**
   * Deletes all user-related data from CardLink.
   */
  deleteAllUserRelatedData(): Promise<void>;

  /**
   * Sets the host app's log file users can attach to CardLink problem
   * reports. On iOS it's the SDK-wide setting and an empty path removes it.
   */
  setHostAppLogFilePath(path: string): Promise<void>;

  /**
   * Replaces the CardLink backend with simulated responses (iOS only). Not
   * meant for production builds.
   */
  setMocks(mocks: IaCardLinkMocks): Promise<void>;

  /**
   * Finishes/dismisses the CardLink flow (iOS only).
   */
  finish(): Promise<void>;

  /**
   * Adds a listener for consent events.
   * @param callback - Called when consent status changes.
   * @returns Subscription handle to remove the listener.
   */
  addConsentEventListener(
    callback: (event: IaCardLinkConsentEvent) => void
  ): IaCardLinkEventSubscription;

  /**
   * Adds a listener for the phone number the user confirmed when accepting
   * consent (iOS only).
   */
  addConsentPhoneNumberListener(
    callback: (phoneNumber: string) => void
  ): IaCardLinkEventSubscription;

  /**
   * Adds a listener for session creation events.
   * @param callback - Called when a session is created.
   * @returns Subscription handle to remove the listener.
   */
  addSessionCreatedListener(
    callback: (session: IaCardLinkSession) => void
  ): IaCardLinkEventSubscription;

  /**
   * Adds a listener for prescription redemption events.
   * @param callback - Called with prescription JSON data.
   * @returns Subscription handle to remove the listener.
   */
  addPrescriptionsRedeemedListener(
    callback: (prescriptions: string) => void
  ): IaCardLinkEventSubscription;

  /**
   * Adds a listener for CardLink lifecycle events.
   * @param callback - Called when lifecycle events occur.
   * @returns Subscription handle to remove the listener.
   */
  addEventListener(
    callback: (event: IaCardLinkEvent) => void
  ): IaCardLinkEventSubscription;

  /**
   * Adds a listener for the cards reported with `IaCardLinkEvent.CardSaved`.
   */
  addSavedCardsListener(
    callback: (cards: IaCardLinkSavedCard[]) => void
  ): IaCardLinkEventSubscription;

  /**
   * Adds a listener for the reason reported with
   * `IaCardLinkEvent.FailedToInitialize` (iOS only).
   */
  addInitializationErrorListener(
    callback: (message: string) => void
  ): IaCardLinkEventSubscription;

  /**
   * Adds a listener for the result reported with `IaCardLinkEvent.Finished`
   * (Android only). `canceled` when the user closed CardLink.
   */
  addResultListener(
    callback: (result: string | null) => void
  ): IaCardLinkEventSubscription;

  /**
   * Adds a listener for analytics events.
   * @param callback - Called with analytics event names.
   * @returns Subscription handle to remove the listener.
   */
  addAnalyticsEventListener(
    callback: (eventName: string) => void
  ): IaCardLinkEventSubscription;
}

/**
 * Interface for the Ordering module.
 * Provides order management and checkout functionality.
 */
export interface IaOrderingModule extends IaModule {
  readonly moduleType: IaBaseModule.Ordering;
  /**
   * Transfers prescription entries to the ia.de backend for checkout.
   *
   * Resolves once the prescriptions are in the cart. On Android, closing the
   * transfer screen during the upload rejects.
   */
  transferPrescriptions(params: TransferPrescriptionsParams): Promise<void>;
  /**
   * Resets the state of user cart, clearing any added products or prescriptions.
   */
  clearCart(): Promise<void>;
  /**
   * Launches the cart screen experience on top of the navigation stack.
   */
  launchCartScreen(): Promise<void>;
  /**
   * Gets the current cart details (iOS only).
   * @returns JSON-encoded `CartDetails`, or null if there's no cart.
   */
  getCartDetails(options?: CartDetailsOptions): Promise<string | null>;
  /**
   * Gets the current cart as the cart listeners report it (iOS only).
   * `clientOrderIDs` is always empty.
   */
  getCartState(options?: CartDetailsOptions): Promise<CartState | null>;
  /**
   * Deletes the order history (iOS only).
   */
  deleteOrderHistory(): Promise<void>;
  /**
   * Adds a listener for cart changes.
   */
  addCartUpdatedListener(
    callback: (state: CartState) => void
  ): IaSdkSubscription;
  /**
   * Adds a listener for completed orders.
   */
  addOrderFinishedListener(
    callback: (signatures: TransactionSignatures) => void
  ): IaSdkSubscription;
}

/**
 * Interface for the OverTheCounter module.
 * Provides product browsing and purchasing functionality.
 */
export interface IaOverTheCounterModule extends IaModule {
  readonly moduleType: IaBaseModule.OverTheCounter;
  /**
   * Launches the product search screen experience on top of the navigation stack.
   */
  launchProductSearchRoute(options?: ProductSearchOptions): Promise<void>;
  /**
   * Clears the cached products of product grids (iOS only).
   */
  clearProductGridCache(): Promise<void>;
}

/**
 * Interface for the Pharmacy module.
 * Provides pharmacy details and management functionality.
 */
export interface IaPharmacyModule extends IaModule {
  readonly moduleType: IaBaseModule.Pharmacy;
  /**
   * Launches the pharmacy details screen experience on top of the navigation stack.
   */
  launchPharmacyDetails(): Promise<void>;
  /**
   * Specifies a numeric pharmacy identifier to be loaded into the AppSDK
   * module. Call it after `initialize`.
   */
  setPharmacyId(pharmacyId: string): Promise<void>;
  /**
   * Stores a numeric pharmacy identifier without validating or loading the
   * pharmacy (iOS only). Use it before `initialize`.
   */
  savePharmacyId(pharmacyId: string): Promise<void>;
  /**
   * Gets the currently selected pharmacy identifier.
   * @returns The pharmacy ID string, or null if no pharmacy is selected.
   */
  getPharmacyId(): Promise<string | null>;
  /**
   * Clears the selected pharmacy and empties its cart.
   */
  clearPharmacyId(): Promise<void>;
  /**
   * Gets the details of the selected pharmacy (iOS only).
   * @returns The pharmacy, or null if no pharmacy is selected.
   */
  getPharmacy(options?: { allowCached?: boolean }): Promise<IaPharmacy | null>;
}

/**
 * Interface for the Prescription module.
 * Provides prescription scanning and management functionality.
 */
export interface IaPrescriptionModule extends IaModule {
  readonly moduleType: IaBaseModule.Prescription;
  /**
   * Launches the "redeem prescription" screen on top of the navigation stack.
   *
   * The screen lets the user choose how to add a prescription to the cart
   * (for example by scanning a QR code, photographing a prescription, or via
   * CardLink), depending on which capabilities are enabled.
   */
  launchRedeemPrescriptionScreen(): Promise<void>;
  /**
   * Launches the prescription scanner directly (iOS only).
   */
  launchPrescriptionScanner(type: IaPrescriptionScannerType): Promise<void>;
  /**
   * Controls the camera of the scanner opened with
   * `launchPrescriptionScanner` (iOS only).
   */
  setScannerCameraState(state: IaScannerCameraState): Promise<void>;
  /**
   * Called when the user photographs a paper prescription, with the image as
   * base64. When not set, the SDK continues with its built-in handling, as it
   * does when the handler throws or doesn't answer within 2 minutes.
   */
  onPrescriptionPhotoScanned:
    | ((imageBase64: string) => Promise<IaPrescriptionScanDecision>)
    | null;
  /**
   * Called when the user scans an e-prescription QR code. Same rules as
   * `onPrescriptionPhotoScanned`.
   */
  onEPrescriptionScanned:
    | ((scan: IaEPrescriptionScan) => Promise<IaPrescriptionScanDecision>)
    | null;
  /**
   * Adds a listener for camera errors of the scanner opened with
   * `launchPrescriptionScanner` (iOS only).
   */
  addScannerCameraErrorListener(
    callback: (message: string) => void
  ): IaSdkSubscription;
}

/**
 * Union type of all available module interfaces.
 */
export type AnyIaModule =
  | IaCardLinkModule
  | IaOrderingModule
  | IaOverTheCounterModule
  | IaPharmacyModule
  | IaPrescriptionModule;
