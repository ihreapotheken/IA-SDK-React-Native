import type { IaCardLinkModule } from '@ihreapotheken/ia-sdk-interface';
import { IaBaseModule } from '@ihreapotheken/ia-sdk-interface';
import IaSdkCardLinkNative from './NativeIaSdkCardLink';

/**
 * Implementation of the CardLink module for the ia.de AppSDK.
 * Provides NFC-based prescription transfer functionality.
 */
export class IaModuleCardLink implements IaCardLinkModule {
  readonly moduleType = IaBaseModule.CardLink;

  async register(): Promise<void> {
    IaSdkCardLinkNative.registerModule?.();
    return Promise.resolve();
  }
}

export default IaModuleCardLink;
