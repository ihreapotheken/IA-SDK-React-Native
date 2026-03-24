import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  DeviceEventEmitter,
  type EmitterSubscription,
} from 'react-native';
import type {
  IaCardLinkModule,
  IaCardLinkLaunchOptions,
  IaCardLinkSession,
  IaCardLinkEventSubscription,
} from '@ihreapotheken/ia-sdk-interface';
import {
  IaBaseModule,
  IaCardLinkConsentEvent,
  IaCardLinkEvent,
  IaCardLinkEnvironment,
} from '@ihreapotheken/ia-sdk-interface';
import IaSdkCardLinkNative from './NativeIaSdkCardLink';
import { CardLinkEvents } from './constants';

/**
 * Implementation of the CardLink module for the ia.de AppSDK.
 * Provides NFC-based prescription transfer functionality.
 */
export class IaModuleCardLink implements IaCardLinkModule {
  readonly moduleType = IaBaseModule.CardLink;

  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS === 'ios') {
      // For TurboModules with RCTEventEmitter, use NativeModules to get the actual instance
      const CardLinkModule = NativeModules.IaSdkCardLink;
      this.eventEmitter = new NativeEventEmitter(CardLinkModule);
    }
  }

  async register(): Promise<void> {
    IaSdkCardLinkNative.registerModule?.();
    return Promise.resolve();
  }

  async launch(options: IaCardLinkLaunchOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        const subscription = DeviceEventEmitter.addListener(
          CardLinkEvents.LAUNCH_RESULT,
          (data: string) => {
            subscription.remove();
            if (data === 'success') {
              resolve();
            } else {
              reject(new Error(data));
            }
          }
        );

        IaSdkCardLinkNative.launchAndroid?.(
          options.sdkApiKey,
          options.flowType,
          options.pharmacyId,
          options.consentStatus,
          options.phoneNumber,
          options.userId,
          options.canCode ?? null,
          options.cardName ?? null,
          options.primaryColor ?? null,
          options.buttonsColor ?? null,
          options.textLinkColor ?? null,
          options.bottomNavigationColor ?? null,
          options.environment ?? null,
          options.saveCardEnabled ?? null
        );
      } else if (Platform.OS === 'ios') {
        IaSdkCardLinkNative.launchIOS?.(
          options.sdkApiKey,
          options.flowType,
          options.pharmacyId,
          options.consentStatus,
          options.phoneNumber,
          options.userId,
          options.canCode ?? null,
          options.cardName ?? null,
          options.primaryColor ?? null,
          options.buttonsColor ?? null,
          options.textLinkColor ?? null,
          options.bottomNavigationColor ?? null,
          options.environment ?? null,
          options.saveCardEnabled ?? null,
          (error: string | null) => {
            if (error === null) {
              resolve();
            } else {
              reject(new Error(error));
            }
          }
        );
      } else {
        reject(new Error('Unsupported platform'));
      }
    });
  }

  async getVersion(): Promise<string | null> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        const subscription = DeviceEventEmitter.addListener(
          CardLinkEvents.VERSION_RESULT,
          (data: string | null) => {
            subscription.remove();
            resolve(data);
          }
        );
        IaSdkCardLinkNative.getVersionAndroid?.();
      } else if (Platform.OS === 'ios') {
        IaSdkCardLinkNative.getVersionIOS?.((result) => resolve(result));
      } else {
        resolve(null);
      }
    });
  }

  async getEnvironment(): Promise<IaCardLinkEnvironment> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        const subscription = DeviceEventEmitter.addListener(
          CardLinkEvents.ENVIRONMENT_RESULT,
          (data: string | null) => {
            subscription.remove();
            resolve(
              (data as IaCardLinkEnvironment) ?? IaCardLinkEnvironment.Production
            );
          }
        );
        IaSdkCardLinkNative.getEnvironmentAndroid?.();
      } else if (Platform.OS === 'ios') {
        IaSdkCardLinkNative.getEnvironmentIOS?.((result) => {
          resolve(
            (result as IaCardLinkEnvironment) ?? IaCardLinkEnvironment.Production
          );
        });
      } else {
        resolve(IaCardLinkEnvironment.Production);
      }
    });
  }

  async getLogFilePath(): Promise<string | null> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        const subscription = DeviceEventEmitter.addListener(
          CardLinkEvents.LOG_PATH_RESULT,
          (data: string | null) => {
            subscription.remove();
            resolve(data);
          }
        );
        IaSdkCardLinkNative.getLogFilePathAndroid?.();
      } else if (Platform.OS === 'ios') {
        IaSdkCardLinkNative.getLogFilePathIOS?.((result) => resolve(result));
      } else {
        resolve(null);
      }
    });
  }

  async getSavedCards(userId: string): Promise<string | null> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        const subscription = DeviceEventEmitter.addListener(
          CardLinkEvents.SAVED_CARDS_RESULT,
          (data: string | null) => {
            subscription.remove();
            resolve(data);
          }
        );
        IaSdkCardLinkNative.getSavedCardsAndroid?.(userId);
      } else if (Platform.OS === 'ios') {
        IaSdkCardLinkNative.getSavedCardsIOS?.(userId, (result) =>
          resolve(result)
        );
      } else {
        resolve(null);
      }
    });
  }

  async deleteCard(userId: string, cardName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        const subscription = DeviceEventEmitter.addListener(
          CardLinkEvents.DELETE_CARD_RESULT,
          (data: string) => {
            subscription.remove();
            if (data === 'success') {
              resolve();
            } else {
              reject(new Error(data));
            }
          }
        );
        IaSdkCardLinkNative.deleteCardAndroid?.(userId, cardName);
      } else if (Platform.OS === 'ios') {
        IaSdkCardLinkNative.deleteCardIOS?.(userId, cardName, (error) => {
          if (error === null) {
            resolve();
          } else {
            reject(new Error(error));
          }
        });
      } else {
        reject(new Error('Unsupported platform'));
      }
    });
  }

  async deleteAllCards(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      console.warn(
        '[IaModuleCardLink] deleteAllCards is only supported on iOS'
      );
      return null;
    }
    return new Promise((resolve) => {
      IaSdkCardLinkNative.deleteAllCardsIOS?.((result) => resolve(result));
    });
  }

  async deleteAllUserRelatedData(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.warn(
        '[IaModuleCardLink] deleteAllUserRelatedData is only supported on iOS'
      );
      return;
    }
    return new Promise((resolve, reject) => {
      IaSdkCardLinkNative.deleteAllUserRelatedDataIOS?.((error) => {
        if (error === null) {
          resolve();
        } else {
          reject(new Error(error));
        }
      });
    });
  }

  // Event Listeners

  addConsentEventListener(
    callback: (event: IaCardLinkConsentEvent) => void
  ): IaCardLinkEventSubscription {
    let subscription: EmitterSubscription;

    if (Platform.OS === 'ios' && this.eventEmitter) {
      subscription = this.eventEmitter.addListener(
        CardLinkEvents.CONSENT_EVENT,
        (data: string) => callback(data as IaCardLinkConsentEvent)
      );
    } else {
      subscription = DeviceEventEmitter.addListener(
        CardLinkEvents.CONSENT_EVENT,
        (data: string) => callback(data as IaCardLinkConsentEvent)
      );
    }

    IaSdkCardLinkNative.addListener?.(CardLinkEvents.CONSENT_EVENT);

    return {
      remove: () => {
        subscription.remove();
        IaSdkCardLinkNative.removeListeners?.(1);
      },
    };
  }

  addSessionCreatedListener(
    callback: (session: IaCardLinkSession) => void
  ): IaCardLinkEventSubscription {
    let subscription: EmitterSubscription;

    if (Platform.OS === 'ios' && this.eventEmitter) {
      subscription = this.eventEmitter.addListener(
        CardLinkEvents.SESSION_CREATED,
        (data: IaCardLinkSession) => callback(data)
      );
    } else {
      subscription = DeviceEventEmitter.addListener(
        CardLinkEvents.SESSION_CREATED,
        (data: IaCardLinkSession) => callback(data)
      );
    }

    IaSdkCardLinkNative.addListener?.(CardLinkEvents.SESSION_CREATED);

    return {
      remove: () => {
        subscription.remove();
        IaSdkCardLinkNative.removeListeners?.(1);
      },
    };
  }

  addPrescriptionsRedeemedListener(
    callback: (prescriptions: string) => void
  ): IaCardLinkEventSubscription {
    let subscription: EmitterSubscription;

    if (Platform.OS === 'ios' && this.eventEmitter) {
      subscription = this.eventEmitter.addListener(
        CardLinkEvents.PRESCRIPTIONS_REDEEMED,
        (data: string) => callback(data)
      );
    } else {
      subscription = DeviceEventEmitter.addListener(
        CardLinkEvents.PRESCRIPTIONS_REDEEMED,
        (data: string) => callback(data)
      );
    }

    IaSdkCardLinkNative.addListener?.(CardLinkEvents.PRESCRIPTIONS_REDEEMED);

    return {
      remove: () => {
        subscription.remove();
        IaSdkCardLinkNative.removeListeners?.(1);
      },
    };
  }

  addEventListener(
    callback: (event: IaCardLinkEvent) => void
  ): IaCardLinkEventSubscription {
    let subscription: EmitterSubscription;

    if (Platform.OS === 'ios' && this.eventEmitter) {
      subscription = this.eventEmitter.addListener(
        CardLinkEvents.EVENT,
        (data: string) => callback(data as IaCardLinkEvent)
      );
    } else {
      subscription = DeviceEventEmitter.addListener(
        CardLinkEvents.EVENT,
        (data: string) => callback(data as IaCardLinkEvent)
      );
    }

    IaSdkCardLinkNative.addListener?.(CardLinkEvents.EVENT);

    return {
      remove: () => {
        subscription.remove();
        IaSdkCardLinkNative.removeListeners?.(1);
      },
    };
  }

  addAnalyticsEventListener(
    callback: (eventName: string) => void
  ): IaCardLinkEventSubscription {
    let subscription: EmitterSubscription;

    if (Platform.OS === 'ios' && this.eventEmitter) {
      subscription = this.eventEmitter.addListener(
        CardLinkEvents.ANALYTICS_EVENT,
        (data: string) => callback(data)
      );
    } else {
      subscription = DeviceEventEmitter.addListener(
        CardLinkEvents.ANALYTICS_EVENT,
        (data: string) => callback(data)
      );
    }

    IaSdkCardLinkNative.addListener?.(CardLinkEvents.ANALYTICS_EVENT);

    return {
      remove: () => {
        subscription.remove();
        IaSdkCardLinkNative.removeListeners?.(1);
      },
    };
  }
}

export default IaModuleCardLink;

// Re-export types for convenience
export type {
  IaCardLinkLaunchOptions,
  IaCardLinkSession,
  IaCardLinkEventSubscription,
} from '@ihreapotheken/ia-sdk-interface';

export {
  IaCardLinkFlowType,
  IaCardLinkConsentStatus,
  IaCardLinkConsentEvent,
  IaCardLinkEvent,
  IaCardLinkEnvironment,
} from '@ihreapotheken/ia-sdk-interface';
