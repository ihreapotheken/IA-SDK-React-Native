import { DeviceEventEmitter, Platform } from 'react-native';
import type {
  IaOrderingModule,
  TransferPrescriptionsParams,
} from '@ihreapotheken/ia-sdk-interface';
import { IaBaseModule } from '@ihreapotheken/ia-sdk-interface';
import IaSdkOrderingNative from './NativeIaSdkOrdering';

/**
 * Implementation of the Ordering module for the ia.de AppSDK.
 * Provides order management and checkout functionality.
 */
export class IaModuleOrdering implements IaOrderingModule {
  readonly moduleType = IaBaseModule.Ordering;

  /**
   * Register the ordering module with the native SDK.
   */
  async register(): Promise<void> {
    IaSdkOrderingNative.registerModule?.();
    return Promise.resolve();
  }

  /**
   * Transfers prescription entries to the ia.de backend for checkout.
   *
   * @param params Transfer prescription parameters
   */
  async transferPrescriptions(
    params: TransferPrescriptionsParams
  ): Promise<void> {
    console.log('[IaModuleOrdering] transferPrescriptions called');
    console.log('[IaModuleOrdering] images count:', params.images?.length ?? 0);
    console.log('[IaModuleOrdering] pdfs count:', params.pdfs?.length ?? 0);
    console.log('[IaModuleOrdering] codes count:', params.codes?.length ?? 0);
    console.log('[IaModuleOrdering] orderId:', params.orderId);
    if (params.images) {
      params.images.forEach((img, i) => {
        console.log(`[IaModuleOrdering] image[${i}] length: ${img.length} chars`);
      });
    }
    if (params.pdfs) {
      params.pdfs.forEach((pdf, i) => {
        console.log(`[IaModuleOrdering] pdf[${i}] length: ${pdf.data.length} chars, insuranceType: ${pdf.insuranceType}`);
      });
    }
    if (params.codes) {
      params.codes.forEach((code, i) => {
        console.log(`[IaModuleOrdering] code[${i}]: ${code}`);
      });
    }

    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        const subscription = DeviceEventEmitter.addListener(
          'TRANSFER_PRESCRIPTIONS_EVENT',
          (data) => {
            if (data === 'success') {
              resolve();
            } else {
              reject(new Error(data));
            }
            subscription.remove();
          }
        );
        IaSdkOrderingNative.transferPrescriptionsAndroid?.(
          params.images ?? null,
          params.pdfs ?? null,
          params.codes ?? null,
          params.orderId ?? null
        );
      }

      if (Platform.OS === 'ios') {
        IaSdkOrderingNative.transferPrescriptionsIOS?.(
          params.images ?? null,
          params.pdfs ?? null,
          params.codes ?? null,
          params.orderId ?? null,
          (error: string | null) => {
            console.log('[IaModuleOrdering] iOS callback, error:', error);
            if (error === null) {
              resolve();
            } else {
              reject(new Error(error));
            }
          }
        );
      }
    });
  }

  /**
   * Resets the state of user cart, clearing any added products or prescriptions.
   */
  async clearCart(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        const subscription = DeviceEventEmitter.addListener(
          'CLEAR_CART_EVENT',
          (data) => {
            if (data === 'success') {
              resolve();
            } else {
              reject(new Error(data));
            }
            subscription.remove();
          }
        );
        IaSdkOrderingNative.clearCartAndroid?.();
      }

      if (Platform.OS === 'ios') {
        IaSdkOrderingNative.clearCartIOS?.((error: string | null) => {
          if (error === null) {
            resolve();
          } else {
            reject(new Error(error));
          }
        });
      }
    });
  }

  /**
   * Launches the cart screen experience on top of the navigation stack.
   */
  async launchCartScreen(): Promise<void> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        IaSdkOrderingNative.launchCartScreenAndroid?.();
        resolve();
      }

      if (Platform.OS === 'ios') {
        IaSdkOrderingNative.launchCartScreenIOS?.();
        resolve();
      }
    });
  }

  /**
   * Gets the current cart details (iOS only).
   *
   * @returns JSON-encoded cart details, or null if empty/unavailable.
   */
  async getCartDetails(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      console.warn(
        '[IaModuleOrdering] getCartDetails is only supported on iOS'
      );
      return null;
    }
    return new Promise((resolve) => {
      IaSdkOrderingNative.getCartDetailsIOS?.((result: string | null) => {
        resolve(result);
      });
    });
  }

  /**
   * Deletes the order history (iOS only).
   */
  async deleteOrderHistory(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.warn(
        '[IaModuleOrdering] deleteOrderHistory is only supported on iOS'
      );
      return;
    }
    return new Promise((resolve, reject) => {
      IaSdkOrderingNative.deleteOrderHistoryIOS?.((error: string | null) => {
        if (error === null) {
          resolve();
        } else {
          reject(new Error(error));
        }
      });
    });
  }
}

export default IaModuleOrdering;
