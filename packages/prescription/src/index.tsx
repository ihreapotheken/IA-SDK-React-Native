import { Platform } from 'react-native';
import type { IaPrescriptionModule } from '@ihreapotheken/ia-sdk-interface';
import { IaBaseModule } from '@ihreapotheken/ia-sdk-interface';
import IaSdkPrescriptionNative from './NativeIaSdkPrescription';

/**
 * Implementation of the Prescription module for the ia.de AppSDK.
 * Provides prescription scanning and management functionality.
 */
export class IaModulePrescription implements IaPrescriptionModule {
  readonly moduleType = IaBaseModule.Prescription;

  async register(): Promise<void> {
    IaSdkPrescriptionNative.registerModule?.();
    return Promise.resolve();
  }

  /**
   * Launches the "redeem prescription" screen on top of the navigation stack.
   */
  async launchRedeemPrescriptionScreen(): Promise<void> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        IaSdkPrescriptionNative.launchRedeemPrescriptionScreenAndroid?.();
        resolve();
      }

      if (Platform.OS === 'ios') {
        IaSdkPrescriptionNative.launchRedeemPrescriptionScreenIOS?.();
        resolve();
      }
    });
  }
}

export default IaModulePrescription;
