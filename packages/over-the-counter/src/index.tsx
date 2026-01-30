import { Platform } from 'react-native';
import type { IaOverTheCounterModule } from '@ihreapotheken/ia-sdk-interface';
import { IaBaseModule } from '@ihreapotheken/ia-sdk-interface';
import IaSdkOtcNative from './NativeIaSdkOtc';

/**
 * Implementation of the Over-the-Counter module for the ia.de AppSDK.
 * Provides product browsing and purchasing functionality.
 */
export class IaModuleOverTheCounter implements IaOverTheCounterModule {
  readonly moduleType = IaBaseModule.OverTheCounter;

  /**
   * Register the OTC module with the native SDK.
   */
  async register(): Promise<void> {
    IaSdkOtcNative.registerModule?.();
    return Promise.resolve();
  }

  /**
   * Launches the product search screen experience on top of the navigation stack.
   */
  async launchProductSearchRoute(): Promise<void> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        IaSdkOtcNative.launchProductSearchRouteAndroid?.();
        resolve();
      }

      if (Platform.OS === 'ios') {
        IaSdkOtcNative.launchProductSearchRouteIOS?.();
        resolve();
      }
    });
  }
}

export default IaModuleOverTheCounter;
