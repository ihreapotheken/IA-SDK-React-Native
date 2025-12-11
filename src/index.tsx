import { DeviceEventEmitter, Platform } from 'react-native';
import IaSdkReactNative from './NativeIaSdkReactNative';

export namespace IaSdkBase {
    export enum ServerEnvironment {
        Development = "development",
        Staging = "staging",
        Production = "production",
    }

    export enum Salutation {
        Male = "Herr",
        Female = "Frau",
        NotDisclosed = "Keine Angabe",
    }
}

/**
 * Base definitions for the ia.de SDK service, including any relevant methods, fields, and callbacks.
 */
export class IaSdk {
  private static accessKey: string | null = null;

  private static clientId: string | null = null;

  private static serverEnv: IaSdkBase.ServerEnvironment | null = null;

  /**
   * Allocate the resources required for the ia.de SDK runtime execution.
   *
   * The method must be called before accessing any additional SDK resources.
   *
   * @param accessKey Authentication key used to identify the host app.
   * @param clientId Client identifier used for pharmacy selection services.
   * @param serverEnvironment Specified server environment for the ia.de services.
   */
  initIaSdk(
    accessKey: string, 
    clientId: string,
    serverEnvironment: IaSdkBase.ServerEnvironment,
  ): Promise<void> {
    IaSdk.accessKey = accessKey;
    IaSdk.clientId = clientId;
    IaSdk.serverEnv = serverEnvironment;
    return new Promise(
      (resolve, reject) => {
        if (Platform.OS === 'android') {
          const subscription = DeviceEventEmitter.addListener(
            'INIT_EVENT', 
            (data) => {
              if (data == "success") {
                resolve();
              } else {
                reject(data);
              }
              subscription.remove();
            },
          );
          IaSdkReactNative.initIaSdkAndroid!(
            accessKey, 
            clientId, 
            serverEnvironment,
          );
        }

        if (Platform.OS === 'ios') {
          IaSdkReactNative.initIaSdkIOS!(
            accessKey, 
            clientId, 
            serverEnvironment,
            (e: any) => {
              if (e == null) {
                resolve();
              } else {
                reject(e);
              }
            },
          );
        }
      },
    );
  }

  /**
   * Launches the dashboard screen on top of the navigation stack.
   */
  startDashboardActivity(): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        if (IaSdk.accessKey == null) {
          return reject('initIaSdk method not invoked.');
        }
        if (Platform.OS === 'android') {
          IaSdkReactNative.startDashboardActivityAndroid!();
          resolve();
        }

        if (Platform.OS === 'ios') {
          this.initIaSdk(
            IaSdk.accessKey!,
            IaSdk.clientId!,
            IaSdk.serverEnv!,
          ).then(
            (_) => {
              IaSdkReactNative.startDashboardActivityIOS!();
              resolve();
            },
            (e) => {
              reject(e);
            },
          );
        }
      },
    );
  }

  logout(): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        if (Platform.OS === 'android') {
          const subscription = DeviceEventEmitter.addListener(
            'LOGOUT_EVENT', 
            (data) => {
              if (data == "success") {
                resolve();
              } else {
                reject(data);
              }
              subscription.remove();
            },
          );
          IaSdkReactNative.logoutAndroid!();
        }

        if (Platform.OS === 'ios') {
          IaSdkReactNative.logoutIOS!(
            (e: any) => {
              if (e == null) {
                resolve();
              } else {
                reject(e);
              }
            },
          );
        }
      }
    );
  }

  /**
   * Forwards the client personal information to the ia.de library for checkout purposes.
   *
   * @param salutation Customer pronouns.
   * @param firstName First / personal customer name.
   * @param lastName Last name or customer surname.
   * @param email Email address used for communication purposes.
   * @param phoneNumberCountryCode Phone number country code (e.g., 49).
   * @param phoneNumberWithoutCountryCode Phone number without country code.
   */
  setGuestUserData(
    salutation: IaSdkBase.Salutation, 
    firstName: string, 
    lastName: string, 
    email: string, 
    phoneNumberCountryCode: number, 
    phoneNumberWithoutCountryCode: number,
  ): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        if (Platform.OS === 'android') {
          const subscription = DeviceEventEmitter.addListener(
            'SET_GUEST_DATA_EVENT', 
            (data) => {
              if (data == "success") {
                resolve();
              } else {
                reject(data);
              }
              subscription.remove();
            },
          );
          IaSdkReactNative.setGuestUserDataAndroid!(
            salutation,
            firstName,
            lastName,
            email,
            phoneNumberCountryCode.toString(),
            phoneNumberWithoutCountryCode.toString(),
          );
        }

        if (Platform.OS === 'ios') {
          IaSdkReactNative.setGuestUserDataIOS!(
            salutation,
            firstName,
            lastName,
            email,
            phoneNumberCountryCode.toString(),
            phoneNumberWithoutCountryCode.toString(),
            (e: any) => {
              if (e == null) {
                resolve();
              } else {
                reject(e);
              }
            },
          );
        }
      },
    );
  }
  
  /**
   * Clears the user cart.
   */
  clearCart(): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        if (Platform.OS === 'android') {
          const subscription = DeviceEventEmitter.addListener(
            'CLEAR_CART_EVENT', 
            (data) => {
              if (data == "success") {
                resolve();
              } else {
                reject(data);
              }
              subscription.remove();
            },
          );
          IaSdkReactNative.clearCartAndroid!();
        }

        if (Platform.OS === 'ios') {
          IaSdkReactNative.clearCartIOS!(
            (e: any) => {
              if (e == null) {
                resolve();
              } else {
                reject(e);
              }
            },
          );
        }
      }
    );
  }

  /**
   * Transfers a collection of prescription entries to the ia.de backend for checkout purposes.
   *
   * @param images Base64-encoded PDF or JPG images.
   * @param pdfs Base64-encoded PDF files.
   * @param codes JSON-encoded eRezept codes (e.g., `["{\"urls\":[\"Task\/test9ba2fee0d07e4ef2b6205f8012e1445b\/$accept?ac=5e24cc059ff244bdbb01efcccf834a6329bdac67a4a64733938fe1b799ac19a9\"]}"]`).
   * @param orderId Client order identifier forwarded in order to differentiate between orders on checkout completion.
   */
  transferPrescriptions(
    images: Array<string> | null, 
    pdfs: Array<string> | null, 
    codes: Array<string> | null, 
    orderId: string | null,
  ): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        if (Platform.OS === 'android') {
          const subscription = DeviceEventEmitter.addListener(
            'TRANSFER_PRESCRIPTIONS_EVENT', 
            (data) => {
              if (data == "success") {
                resolve();
              } else {
                reject(data);
              }
              subscription.remove();
            },
          );
          IaSdkReactNative.transferPrescriptionsAndroid!(
            images,
            pdfs,
            codes,
            orderId,
          );
        }

        if (Platform.OS === 'ios') {
          IaSdkReactNative.transferPrescriptionsIOS!(
            images,
            pdfs,
            codes,
            orderId,
            (e: any) => {
              if (e == null) {
                resolve();
              } else {
                reject(e);
              }
            },
          );
        }
      }
    );
  }

  /**
   * Closes all overlaying ia.de screen contents.
   */
  finishAllActivities(): Promise<void> {
    return new Promise(
      (resolve, _) => {
        if (Platform.OS === 'android') {
          IaSdkReactNative.finishAllActivitiesAndroid!();
          resolve();
        }

        if (Platform.OS === 'ios') {
          IaSdkReactNative.finishAllActivitiesIOS!();
          resolve();
        }
      }
    );
  }
}