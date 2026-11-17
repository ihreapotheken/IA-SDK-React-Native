import type {
  CartDetails,
  CartDetailsOptions,
  CartState,
  IaOrderingModule,
  IaSdkSubscription,
  TransactionSignatures,
  TransferPrescriptionsParams,
} from '@ihreapotheken/ia-sdk-interface';
import {
  IaBaseModule,
  IaTransferPrescriptionsFinishAction,
} from '@ihreapotheken/ia-sdk-interface';
import { IaSdkInternal, warnUnsupported } from '@ihreapotheken/ia-sdk-core';
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
    IaSdkOrderingNative.registerModule();
  }

  /**
   * Transfers prescription entries to the ia.de backend for checkout.
   *
   * Resolves once the prescriptions are in the cart. On Android the SDK
   * reports that through the updated cart with `openCart` and `noAction`, and
   * only once the user closed the confirmation with `showBottomSheet`.
   * Closing the transfer screen during the upload rejects there.
   *
   * @param params Transfer prescription parameters
   */
  async transferPrescriptions(
    params: TransferPrescriptionsParams
  ): Promise<void> {
    return IaSdkOrderingNative.transferPrescriptions({
      images: params.images ?? [],
      pdfs: params.pdfs ?? [],
      codes: params.codes ?? [],
      orderId: params.orderId ?? null,
      finishAction:
        params.finishAction ?? IaTransferPrescriptionsFinishAction.OpenCart,
      showActivityIndicator: params.showActivityIndicator ?? true,
    });
  }

  /**
   * Resets the state of user cart, clearing any added products or prescriptions.
   */
  async clearCart(): Promise<void> {
    return IaSdkOrderingNative.clearCart();
  }

  /**
   * Launches the cart screen experience on top of the navigation stack.
   */
  async launchCartScreen(): Promise<void> {
    return IaSdkInternal.launchScreen(IaSdkInternal.screens.CART);
  }

  /**
   * Gets the current cart details (iOS only).
   *
   * Fails until the SDK has run its prerequisites in the current app session.
   *
   * @returns JSON-encoded `CartDetails`, or null if there's no cart.
   */
  async getCartDetails(options?: CartDetailsOptions): Promise<string | null> {
    const details = await this.loadCartDetails('getCartDetails', options);
    return details ? JSON.stringify(details) : null;
  }

  /**
   * Gets the current cart as the cart listeners report it (iOS only).
   * `clientOrderIDs` is always empty, as the cart details don't include them.
   */
  async getCartState(options?: CartDetailsOptions): Promise<CartState | null> {
    const details = await this.loadCartDetails('getCartState', options);
    if (!details) {
      return null;
    }
    return {
      totalAmountInCart: details.totalAmountInCart,
      clientOrderIDs: [],
      products: details.products,
    };
  }

  private async loadCartDetails(
    method: string,
    options?: CartDetailsOptions
  ): Promise<CartDetails | null> {
    if (warnUnsupported('IaModuleOrdering', method, 'ios')) return null;
    const details = await IaSdkOrderingNative.getCartDetails!(
      options?.allowCached ?? true,
      options?.shouldEmitCartUpdate ?? false
    );
    return (details as CartDetails | null) ?? null;
  }

  /**
   * Deletes the order history (iOS only).
   */
  async deleteOrderHistory(): Promise<void> {
    if (warnUnsupported('IaModuleOrdering', 'deleteOrderHistory', 'ios')) {
      return;
    }
    return IaSdkOrderingNative.deleteOrderHistory!();
  }

  /**
   * Adds a listener for cart changes.
   *
   * On Android, where updates only carry the counts, an update with the same
   * counts as the previous one isn't sent.
   */
  addCartUpdatedListener(
    callback: (state: CartState) => void
  ): IaSdkSubscription {
    return IaSdkInternal.addEventListener<CartState>(
      IaSdkInternal.events.CART_UPDATED,
      (state) =>
        callback({
          ...state,
          clientOrderIDs: state.clientOrderIDs ?? [],
        })
    );
  }

  /**
   * Adds a listener for completed orders.
   */
  addOrderFinishedListener(
    callback: (signatures: TransactionSignatures) => void
  ): IaSdkSubscription {
    return IaSdkInternal.addEventListener<TransactionSignatures>(
      IaSdkInternal.events.ORDER_FINISHED,
      (signatures) =>
        callback({
          orderCode: signatures.orderCode,
          orderCodes: signatures.orderCodes ?? [signatures.orderCode],
          clientOrderIDs: signatures.clientOrderIDs ?? [],
        })
    );
  }
}

export default IaModuleOrdering;

export { IaCartButton } from './IaCartButton';
export type { IaCartButtonProps } from './IaCartButton';
export { IaTransferPrescriptionsFinishAction } from '@ihreapotheken/ia-sdk-interface';
