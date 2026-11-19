import { useCallback, useEffect, useState } from 'react';
import { iaSdk, IaSdkInitializationState } from '@ihreapotheken/ia-sdk-core';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';
import { IaModuleOrdering } from '@ihreapotheken/ia-sdk-ordering';
import { IaModuleOverTheCounter } from '@ihreapotheken/ia-sdk-over-the-counter';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';
import { IaModulePrescription } from '@ihreapotheken/ia-sdk-prescription';
import { eventLog } from '../testing/eventLog';
import { attachSdkListeners } from '../testing/sdkListeners';
import { installHostCallbacks } from '../testing/testSettings';
import { setInitialMascotVisibility } from './appearance';
import { buildInitConfig, type InitOptions } from './initConfig';

/**
 * Registers every module on mount and initializes the SDK on demand, with the
 * options the Home tab switches. Tracks the SDK's initialization state too, so
 * a remounted app (e.g. after Fast Refresh) keeps its buttons enabled.
 */
export function useDemoSdk() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [didInitialize, setDidInitialize] = useState(false);
  const [cardLinkModule, setCardLinkModule] = useState<IaModuleCardLink | null>(
    null
  );
  const [initState, setInitState] = useState<IaSdkInitializationState>(
    IaSdkInitializationState.Uninitialized
  );

  useEffect(() => {
    const subscription = iaSdk.addInitializationStateListener(setInitState);
    iaSdk
      .getInitializationState()
      .then(setInitState)
      .catch(() => undefined);

    const registerModules = async () => {
      try {
        const cardLink = new IaModuleCardLink();
        await iaSdk.register([
          new IaModuleOrdering(),
          new IaModuleOverTheCounter(),
          new IaModulePharmacy(),
          new IaModulePrescription(),
          cardLink,
        ]);
        attachSdkListeners();
        installHostCallbacks();
        setCardLinkModule(cardLink);
        setIsRegistered(true);
        eventLog.add('App', 'Modules registered');
      } catch (e) {
        console.error('Module registration error:', e);
        eventLog.add('App', `Module registration failed: ${String(e)}`);
      }
    };
    registerModules();
    return () => subscription.remove();
  }, []);

  const initialize = useCallback(async (options: InitOptions) => {
    await iaSdk.initialize(buildInitConfig(options));
    setInitialMascotVisibility(!options.hideMascotIllustrations);
    setDidInitialize(true);
    eventLog.add('App', 'SDK initialized');
  }, []);

  return {
    isRegistered,
    isInitialized:
      didInitialize || initState === IaSdkInitializationState.Initialized,
    initState,
    cardLinkModule,
    initialize,
  };
}
