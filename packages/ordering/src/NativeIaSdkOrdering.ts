import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Native spec of the ordering module. Internal to this package.
 */
export interface Spec extends TurboModule {
  // Renamed from 'register' to avoid a C++ reserved keyword.
  registerModule(): void;

  clearCart(): Promise<void>;

  /**
   * `params`: `{ images: string[] (base64), pdfs: { data (base64),
   * insuranceType }[], codes: string[], orderId: string | null,
   * finishAction: string, showActivityIndicator: boolean }`.
   */
  transferPrescriptions(params: Object): Promise<void>;

  // iOS only
  /** Resolves with `{ totalAmountInCart, products: { pzn, amount }[] }` or null. */
  getCartDetails?(
    allowCached: boolean,
    shouldEmitCartUpdate: boolean
  ): Promise<Object | null>;
  deleteOrderHistory?(): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkOrdering');
