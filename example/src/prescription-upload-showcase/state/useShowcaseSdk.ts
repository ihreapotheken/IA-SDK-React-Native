import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { iaSdk } from '@ihreapotheken/ia-sdk-core';
import {
  describeError,
  initialize,
  loadCartCount,
  loadPharmacy,
  NO_PHARMACY,
  ordering,
  pharmacy,
  placedOrderFrom,
  registerModules,
  transferFromHostApp,
  type PharmacyState,
  type PlacedOrder,
} from '../sdk/showcaseSdk';

export type Connection =
  | { status: 'connecting'; isSlow: boolean }
  | { status: 'ready' }
  | { status: 'failed'; message: string };

/** How long connecting takes before the showcase hints at the VPN. */
const SLOW_CONNECTION_MS = 12000;

/**
 * The SDK as the showcase shows it: connects on mount (registers the modules
 * and initializes), and keeps the pharmacy, the cart count and a placed order
 * up to date from the SDK's listeners. Its calls update that state too.
 */
export function useShowcaseSdk() {
  const [connection, setConnection] = useState<Connection>({
    status: 'connecting',
    isSlow: false,
  });
  const [isRegistered, setIsRegistered] = useState(false);
  const [pharmacyState, setPharmacyState] =
    useState<PharmacyState>(NO_PHARMACY);
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  // The order IDs of the prescriptions this app handed over, which the SDK
  // reports back with the placed order (iOS) or not at all (Android).
  const hostOrderIds = useRef<string[]>([]);
  const isReady = connection.status === 'ready';

  const refreshPharmacy = useCallback(() => {
    loadPharmacy()
      .then(setPharmacyState)
      .catch(() => undefined);
  }, []);

  const refreshCart = useCallback(() => {
    loadCartCount()
      .then((count) => count !== null && setCartCount(count))
      .catch(() => undefined);
  }, []);

  const connect = useCallback(async () => {
    setConnection({ status: 'connecting', isSlow: false });
    const slowTimer = setTimeout(
      () =>
        setConnection((current) =>
          current.status === 'connecting'
            ? { status: 'connecting', isSlow: true }
            : current
        ),
      SLOW_CONNECTION_MS
    );
    try {
      await registerModules();
      setIsRegistered(true);
      await initialize();
      setConnection({ status: 'ready' });
      refreshPharmacy();
      refreshCart();
    } catch (error) {
      setConnection({ status: 'failed', message: describeError(error) });
    } finally {
      clearTimeout(slowTimer);
    }
  }, [refreshCart, refreshPharmacy]);

  useEffect(() => {
    connect();
  }, [connect]);

  // The SDK reports what changes in its screens.
  useEffect(() => {
    if (!isRegistered) return;
    const subscriptions = [
      iaSdk.addApofinderPharmacyChangedListener(() => refreshPharmacy()),
      ordering().addCartUpdatedListener((state) =>
        setCartCount(state.totalAmountInCart)
      ),
      ordering().addOrderFinishedListener((signatures) => {
        // Like the NativeScript demo, the app takes over from the SDK's
        // screens and shows the order's codes. Right away: Android pauses JS
        // timers while the SDK's screens are in front.
        setCartCount(0);
        iaSdk.finishAllActivities().catch(() => undefined);
        setPlacedOrder(placedOrderFrom(signatures, hostOrderIds.current));
        hostOrderIds.current = [];
      }),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [isRegistered, refreshPharmacy]);

  // Android's SDK screens are activities of their own; coming back from them,
  // the pharmacy may have changed in the prerequisites.
  useEffect(() => {
    if (!isReady) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshPharmacy();
        refreshCart();
      }
    });
    return () => subscription.remove();
  }, [isReady, refreshCart, refreshPharmacy]);

  const transfer = useCallback(async () => {
    hostOrderIds.current = [
      ...hostOrderIds.current,
      await transferFromHostApp(),
    ];
    refreshCart();
  }, [refreshCart]);

  const selectPharmacy = useCallback(
    async (id: string) => {
      await pharmacy().setPharmacyId(id);
      refreshPharmacy();
    },
    [refreshPharmacy]
  );

  const clearCart = useCallback(async () => {
    await ordering().clearCart();
    setCartCount(0);
  }, []);

  const clearPharmacy = useCallback(async () => {
    await pharmacy().clearPharmacyId();
    setPharmacyState(NO_PHARMACY);
    setCartCount(0);
  }, []);

  const logout = useCallback(async () => {
    await iaSdk.logout();
    setPharmacyState(NO_PHARMACY);
    setCartCount(0);
    setPlacedOrder(null);
    hostOrderIds.current = [];
  }, []);

  const dismissOrder = useCallback(() => setPlacedOrder(null), []);

  return {
    connection,
    isReady,
    retry: connect,
    pharmacy: pharmacyState,
    cartCount,
    placedOrder,
    transfer,
    selectPharmacy,
    clearCart,
    clearPharmacy,
    logout,
    dismissOrder,
  };
}
