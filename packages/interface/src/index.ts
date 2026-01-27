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
 * Parameters for transferring prescriptions.
 */
export interface TransferPrescriptionsParams {
  /** Base64-encoded images (JPG/PNG). */
  images?: string[] | null;
  /** Base64-encoded PDF files. */
  pdfs?: string[] | null;
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
