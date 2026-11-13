import type {
  IaOverTheCounterModule,
  ProductSearchOptions,
} from '@ihreapotheken/ia-sdk-interface';
import { IaBaseModule } from '@ihreapotheken/ia-sdk-interface';
import { IaSdkInternal, warnUnsupported } from '@ihreapotheken/ia-sdk-core';
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
    IaSdkOtcNative.registerModule();
  }

  /**
   * Launches the product search screen experience on top of the navigation stack.
   *
   * @param options.focusesOnAppear Whether the search field is focused when
   * the screen opens (iOS). Unset keeps the SDK default.
   */
  async launchProductSearchRoute(
    options?: ProductSearchOptions
  ): Promise<void> {
    return IaSdkInternal.launchScreen(IaSdkInternal.screens.SEARCH, {
      focusesOnAppear: options?.focusesOnAppear ?? null,
    });
  }

  /**
   * Clears the cached products of product grids, so they're loaded again the
   * next time they're shown (iOS only).
   */
  async clearProductGridCache(): Promise<void> {
    if (
      warnUnsupported('IaModuleOverTheCounter', 'clearProductGridCache', 'ios')
    ) {
      return;
    }
    return IaSdkOtcNative.clearProductGridCache!();
  }
}

export default IaModuleOverTheCounter;

export { IaProductGrid } from './IaProductGrid';
export type { IaProductGridProps } from './IaProductGrid';
export { IaProductDisplayType } from '@ihreapotheken/ia-sdk-interface';
export type { ProductSearchOptions } from '@ihreapotheken/ia-sdk-interface';
