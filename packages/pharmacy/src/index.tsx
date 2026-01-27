import { Platform } from 'react-native';
import type { IaPharmacyModule } from '@ihreapotheken/ia-sdk-interface';
import { IaBaseModule } from '@ihreapotheken/ia-sdk-interface';
import IaSdkPharmacyNative from './NativeIaSdkPharmacy';

/**
 * Implementation of the Pharmacy module for the ia.de AppSDK.
 * Provides pharmacy details and management functionality.
 */
export class IaModulePharmacy implements IaPharmacyModule {
  readonly moduleType = IaBaseModule.Pharmacy;

  async register(): Promise<void> {
    IaSdkPharmacyNative.registerModule?.();
    return Promise.resolve();
  }

  async launchPharmacyDetails(): Promise<void> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        IaSdkPharmacyNative.launchPharmacyDetailsAndroid?.();
        resolve();
      }
      if (Platform.OS === 'ios') {
        IaSdkPharmacyNative.launchPharmacyDetailsIOS?.();
        resolve();
      }
    });
  }

  async setPharmacyId(pharmacyId: string): Promise<void> {
    return new Promise((resolve) => {
      if (Platform.OS === 'android') {
        IaSdkPharmacyNative.setPharmacyIdAndroid?.(pharmacyId);
        resolve();
      }
      if (Platform.OS === 'ios') {
        IaSdkPharmacyNative.setPharmacyIdIOS?.(pharmacyId);
        resolve();
      }
    });
  }
}

export default IaModulePharmacy;
