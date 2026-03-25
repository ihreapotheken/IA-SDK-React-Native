import { Platform } from 'react-native';
import type {
  IaModule,
  InitConfig,
  GuestUserData,
  AnyIaModule,
} from '@ihreapotheken/ia-sdk-interface';
import {
  IaBaseModule,
  ServerEnvironment,
} from '@ihreapotheken/ia-sdk-interface';
import IaSdkCoreNative from './NativeIaSdkCore';

// Re-export types from interface package
export {
  IaBaseModule,
  ServerEnvironment,
  Salutation,
  PrescriptionInsuranceType,
  // CardLink enums
  IaCardLinkFlowType,
  IaCardLinkConsentStatus,
  IaCardLinkConsentEvent,
  IaCardLinkEvent,
  IaCardLinkEnvironment,
} from '@ihreapotheken/ia-sdk-interface';
export type {
  IaModule,
  InitConfig,
  GuestUserData,
  TransferPrescriptionsParams,
  PdfPrescription,
  CartState,
  TransactionSignatures,
  IaCardLinkModule,
  IaOrderingModule,
  IaOverTheCounterModule,
  IaPharmacyModule,
  IaPrescriptionModule,
  AnyIaModule,
  // CardLink types
  IaCardLinkLaunchOptions,
  IaCardLinkSession,
  IaCardLinkEventSubscription,
} from '@ihreapotheken/ia-sdk-interface';

/**
 * Main entrypoint for the ia.de AppSDK services and features.
 */
export class IaSdk {
  private static _instance: IaSdk;

  private accessKey: string | null = null;
  private clientId: string | null = null;
  private serverEnv: ServerEnvironment | null = null;
  private channelId: number | null = null;
  private initialized = false;
  private modulesRegistered = false;

  private registeredModules: Map<IaBaseModule, IaModule> = new Map();

  private constructor() {}

  /**
   * Globally-accessible singleton class instance.
   */
  static get instance(): IaSdk {
    if (!IaSdk._instance) {
      IaSdk._instance = new IaSdk();
    }
    return IaSdk._instance;
  }

  /**
   * Register a collection of specified modules for client integration.
   *
   * Modules provide specific functionality to client integrations,
   * and are available after registering via the getModule method.
   *
   * @param modules Array of module instances to register
   */
  async register(modules: IaModule[]): Promise<void> {
    if (this.modulesRegistered) {
      return;
    }

    for (const module of modules) {
      await module.register();
      this.registeredModules.set(module.moduleType, module);
    }

    this.modulesRegistered = true;
  }

  /**
   * Get a registered module by type.
   *
   * @param type The module type to retrieve
   * @throws Error if the module is not registered
   */
  getModule<T extends AnyIaModule>(type: T['moduleType']): T {
    const module = this.registeredModules.get(type);
    if (!module) {
      throw new Error(
        `Module ${type} not initialized. Ensure the object is instantiated and forwarded to the "register" method.`
      );
    }
    return module as T;
  }

  /**
   * Check if a module is registered.
   *
   * @param type The module type to check
   */
  hasModule(type: IaBaseModule): boolean {
    return this.registeredModules.has(type);
  }

  /**
   * Allocate the resources required for the ia.de SDK runtime execution.
   *
   * The method must be called before accessing any additional SDK resources.
   *
   * @param config SDK initialization configuration
   */
  async initialize(config: InitConfig): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.accessKey = config.accessKey;
    this.clientId = config.clientId;
    this.serverEnv = config.serverEnvironment;
    this.channelId = config.channelId ?? null;

    return new Promise((resolve, reject) => {
      const completionHandler = (error: string | null) => {
        if (error === null) {
          this.initialized = true;
          resolve();
        } else {
          reject(new Error(error));
        }
      };

      if (Platform.OS === 'android') {
        IaSdkCoreNative.initIaSdkAndroid?.(
          config.accessKey,
          config.clientId,
          config.serverEnvironment,
          config.channelId ?? null,
          completionHandler
        );
      }

      if (Platform.OS === 'ios') {
        IaSdkCoreNative.initIaSdkIOS?.(
          config.accessKey,
          config.clientId,
          config.serverEnvironment,
          config.channelId ?? null,
          completionHandler
        );
      }
    });
  }

  /**
   * Resets the user data and onboarding status (pharmacy selection, user consents statuses).
   */
  async logout(): Promise<void> {
    return new Promise((resolve, reject) => {
      const completionHandler = (error: string | null) => {
        if (error === null) {
          resolve();
        } else {
          reject(new Error(error));
        }
      };

      if (Platform.OS === 'android') {
        IaSdkCoreNative.logoutAndroid?.(completionHandler);
      }

      if (Platform.OS === 'ios') {
        IaSdkCoreNative.logoutIOS?.(completionHandler);
      }
    });
  }

  /**
   * Forwards the client personal information to the ia.de library for checkout purposes.
   *
   * @param data Guest user data for checkout
   */
  async setGuestUserData(data: GuestUserData): Promise<void> {
    return new Promise((resolve, reject) => {
      const completionHandler = (error: string | null) => {
        if (error === null) {
          resolve();
        } else {
          reject(new Error(error));
        }
      };

      if (Platform.OS === 'android') {
        IaSdkCoreNative.setGuestUserDataAndroid?.(
          data.salutation,
          data.firstName,
          data.lastName,
          data.email,
          data.phoneNumberCountryCode.toString(),
          data.phoneNumberWithoutCountryCode.toString(),
          completionHandler
        );
      }

      if (Platform.OS === 'ios') {
        IaSdkCoreNative.setGuestUserDataIOS?.(
          data.salutation,
          data.firstName,
          data.lastName,
          data.email,
          data.phoneNumberCountryCode.toString(),
          data.phoneNumberWithoutCountryCode.toString(),
          completionHandler
        );
      }
    });
  }

  /**
   * Launches the dashboard screen on top of the navigation stack.
   */
  async startDashboardActivity(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.accessKey === null) {
        return reject(new Error('initialize method not invoked.'));
      }

      if (Platform.OS === 'android') {
        IaSdkCoreNative.startDashboardActivityAndroid?.();
        resolve();
      }

      if (Platform.OS === 'ios') {
        // Re-initialize on iOS before showing dashboard
        this.initialize({
          accessKey: this.accessKey!,
          clientId: this.clientId!,
          serverEnvironment: this.serverEnv!,
          channelId: this.channelId ?? undefined,
        }).then(
          () => {
            IaSdkCoreNative.startDashboardActivityIOS?.();
            resolve();
          },
          (error) => {
            reject(error);
          }
        );
      }
    });
  }

  /**
   * Closes all overlaying ia.de screen contents.
   */
  async finishAllActivities(): Promise<void> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        IaSdkCoreNative.finishAllActivitiesAndroid?.();
        resolve();
      }

      if (Platform.OS === 'ios') {
        IaSdkCoreNative.finishAllActivitiesIOS?.();
        resolve();
      }
    });
  }

  /**
   * Transfers user data from SDK v1 to the current SDK.
   *
   * This method is intended to be invoked before the `initialize` method.
   */
  async transferSDKv1UserData(): Promise<void> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        IaSdkCoreNative.transferSDKv1UserDataAndroid?.();
        resolve();
      }

      if (Platform.OS === 'ios') {
        IaSdkCoreNative.transferSDKv1UserDataIOS?.();
        resolve();
      }
    });
  }
}

/**
 * Singleton instance of the IaSdk class.
 */
export const iaSdk = IaSdk.instance;
