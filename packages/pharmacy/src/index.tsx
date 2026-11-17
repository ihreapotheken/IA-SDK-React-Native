import type {
  IaPharmacy,
  IaPharmacyModule,
} from '@ihreapotheken/ia-sdk-interface';
import { IaBaseModule } from '@ihreapotheken/ia-sdk-interface';
import { IaSdkInternal, warnUnsupported } from '@ihreapotheken/ia-sdk-core';
import IaSdkPharmacyNative from './NativeIaSdkPharmacy';

/**
 * Implementation of the Pharmacy module for the ia.de AppSDK.
 * Provides pharmacy details and management functionality.
 */
export class IaModulePharmacy implements IaPharmacyModule {
  readonly moduleType = IaBaseModule.Pharmacy;

  async register(): Promise<void> {
    IaSdkPharmacyNative.registerModule();
  }

  /**
   * Launches the pharmacy details screen experience on top of the navigation stack.
   */
  async launchPharmacyDetails(): Promise<void> {
    return IaSdkInternal.launchScreen(IaSdkInternal.screens.PHARMACY);
  }

  /**
   * Selects the pharmacy with the given numeric identifier, for example
   * `"1234"`. Other values reject with `ARG_ERROR`.
   *
   * Call it after `initialize`; on Android it rejects with
   * `SDK_NOT_INITIALIZED` before.
   */
  async setPharmacyId(pharmacyId: string): Promise<void> {
    return IaSdkPharmacyNative.setPharmacyId(pharmacyId);
  }

  /**
   * Stores a numeric pharmacy identifier without checking that the pharmacy
   * exists or loading it (iOS only). Use it before `initialize`; afterwards
   * use `setPharmacyId`.
   */
  async savePharmacyId(pharmacyId: string): Promise<void> {
    if (warnUnsupported('IaModulePharmacy', 'savePharmacyId', 'ios')) return;
    return IaSdkPharmacyNative.savePharmacyId!(pharmacyId);
  }

  /**
   * Gets the currently selected pharmacy identifier, or null if none is
   * selected. On Android call it after `initialize`.
   */
  async getPharmacyId(): Promise<string | null> {
    return IaSdkPharmacyNative.getPharmacyId();
  }

  /**
   * Clears the selected pharmacy, and empties the cart that belongs to it.
   */
  async clearPharmacyId(): Promise<void> {
    return IaSdkPharmacyNative.clearPharmacyId();
  }

  /**
   * Gets the details of the selected pharmacy, or null if none is selected
   * (iOS only).
   *
   * @param options.allowCached Whether previously loaded details may be
   * returned. Defaults to `true`.
   */
  async getPharmacy(options?: {
    allowCached?: boolean;
  }): Promise<IaPharmacy | null> {
    if (warnUnsupported('IaModulePharmacy', 'getPharmacy', 'ios')) return null;
    const pharmacy = await IaSdkPharmacyNative.getPharmacy!(
      options?.allowCached ?? true
    );
    return (pharmacy as IaPharmacy | null) ?? null;
  }
}

export default IaModulePharmacy;

export type { IaPharmacy } from '@ihreapotheken/ia-sdk-interface';
