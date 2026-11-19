import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { copy } from '../copy';
import { describeError } from '../sdk/showcaseSdk';

/** What a button running an SDK call takes: its tap, its progress, and whether it takes taps. */
export interface ActionProps {
  onPress: () => void;
  isBusy: boolean;
  disabled: boolean;
}

interface ActionOptions {
  /** Tells apart buttons running the same call, e.g. one chip per pharmacy. Defaults to the name. */
  key?: string;
  onSuccess?: () => void;
}

/**
 * Runs the buttons' SDK calls one at a time: the button whose call runs shows a
 * spinner and the others take no taps, also before they re-render as disabled,
 * so a second tap can't open an SDK screen twice. A failed call is alerted.
 *
 * @param isEnabled Whether buttons take taps at all, e.g. once the SDK is ready.
 * @returns `action(name, call, options)`, the props of a button running `call`;
 *   `name` titles its failure alert.
 */
export function useActionRunner(isEnabled: boolean) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busyKeyRef = useRef<string | null>(null);

  const run = useCallback(
    async (
      name: string,
      call: () => Promise<unknown>,
      { key = name, onSuccess }: ActionOptions
    ) => {
      if (busyKeyRef.current !== null) return;
      busyKeyRef.current = key;
      setBusyKey(key);
      try {
        await call();
        onSuccess?.();
      } catch (error) {
        Alert.alert(copy.failed(name), describeError(error));
      } finally {
        busyKeyRef.current = null;
        setBusyKey(null);
      }
    },
    []
  );

  return (
    name: string,
    call: () => Promise<unknown>,
    options: ActionOptions = {}
  ): ActionProps => ({
    onPress: () => {
      run(name, call, options);
    },
    isBusy: busyKey === (options.key ?? name),
    disabled: !isEnabled || busyKey !== null,
  });
}
