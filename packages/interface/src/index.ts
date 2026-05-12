/**
 * Shared interface definitions for the ia.de AppSDK React Native service.
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
  /** CardLink will close. */
  WillExit = 'willExitCardlink',
  /** NFC scanning is about to start. */
  WillStartScanning = 'willStartScanning',
  /** CardLink failed to initialize. */
  FailedToInitialize = 'failedToInitialize',
  /** User requested to navigate to cart. */
  GoToCart = 'goToCart',
  /** User requested to view terms and conditions. */
  OpenTermsAndConditions = 'openTermsAndConditions',
  /** Insurance card was saved successfully. */
  CardSaved = 'cardSaved',
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
 * Session information from CardLink.
 */
export interface IaCardLinkSession {
  /** Unique session identifier. */
  cardSessionId: string;
  /** Session expiration timestamp (Unix epoch milliseconds). */
  sessionExpireTimestamp: number;
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
  /** Optional card display name. */
  cardName?: string;
  /** Primary UI color (ARGB integer). */
  primaryColor?: number;
  /** Buttons UI color (ARGB integer). */
  buttonsColor?: number;
  /** Text link UI color (ARGB integer). */
  textLinkColor?: number;
  /** Bottom navigation UI color (ARGB integer). */
  bottomNavigationColor?: number;
  /** SDK environment. */
  environment?: IaCardLinkEnvironment;
  /** Enable card saving feature. */
  saveCardEnabled?: boolean;
  /** Finish action determining what happens with prescriptions after NFC scanning. */
  finishAction?: IaCardLinkFinishAction;
}

/**
 * Subscription handle for CardLink event listeners.
 */
export interface IaCardLinkEventSubscription {
  /** Removes the event listener. */
  remove(): void;
}

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
 */
export enum Salutation {
  Male = 'Herr',
  Female = 'Frau',
  NotDisclosed = 'Keine Angabe',
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
  /** Phone number without country code. */
  phoneNumberWithoutCountryCode: number;
}

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
}

/**
 * State of the shopping cart.
 */
export interface CartState {
  /** Total number of items in cart (products + prescriptions, each unit counted individually). */
  totalAmountInCart: number;
  /** Array of external/client order IDs. */
  clientOrderIDs: string[];
}

/**
 * Information about a completed order.
 */
export interface TransactionSignatures {
  /** Order code from backend. */
  orderCode: string;
  /** Order ID provided by host app using transferPrescriptions (optional). */
  clientOrderIDs?: string[] | null;
}

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
}

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
   * Gets the current CardLink SDK environment.
   * @returns The current environment.
   */
  getEnvironment(): Promise<IaCardLinkEnvironment>;

  /**
   * Gets the path to the CardLink SDK log file.
   * @returns The log file path, or null if unavailable.
   */
  getLogFilePath(): Promise<string | null>;

  /**
   * Gets saved insurance cards for a user.
   * @param userId - The user identifier.
   * @returns JSON-encoded list of saved cards, or null if unavailable.
   */
  getSavedCards(userId: string): Promise<string | null>;

  /**
   * Deletes a specific saved card.
   * @param userId - The user identifier.
   * @param cardName - The card name to delete.
   */
  deleteCard(userId: string, cardName: string): Promise<void>;

  /**
   * Deletes all saved cards (iOS only).
   * @returns Status string ("successDeleteAll" or "emptyStorage"), or null on Android.
   */
  deleteAllCards(): Promise<string | null>;

  /**
   * Deletes all user-related data from CardLink (iOS only).
   */
  deleteAllUserRelatedData(): Promise<void>;

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
   * @returns JSON-encoded cart details, or null if empty/unavailable.
   */
  getCartDetails(): Promise<string | null>;
  /**
   * Deletes the order history (iOS only).
   */
  deleteOrderHistory(): Promise<void>;
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
  launchProductSearchRoute(): Promise<void>;
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
   * Specifies a pharmacy identifier to be loaded into the AppSDK module.
   */
  setPharmacyId(pharmacyId: string): Promise<void>;
  /**
   * Gets the currently selected pharmacy identifier.
   * @returns The pharmacy ID string, or null if no pharmacy is selected.
   */
  getPharmacyId(): Promise<string | null>;
}

/**
 * Interface for the Prescription module.
 * Provides prescription scanning and management functionality.
 */
export interface IaPrescriptionModule extends IaModule {
  readonly moduleType: IaBaseModule.Prescription;
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
