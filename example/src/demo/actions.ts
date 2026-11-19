import { Alert } from 'react-native';
import { eventLog } from './testing/eventLog';

/**
 * Shows the result of an SDK call, or its error with the error code, and
 * adds it to the event log. An alert shown while an SDK screen closes, for
 * example after a transfer with a confirmation sheet, can get lost with that
 * screen; the log keeps the result.
 */
export async function runAction<T>(
  title: string,
  action: () => Promise<T>,
  describeResult?: (result: T) => string,
  { alertsSuccess = true }: { alertsSuccess?: boolean } = {}
) {
  try {
    const result = await action();
    const message = describeResult
      ? describeResult(result)
      : // Native void methods resolve with null on Android and undefined on iOS.
        result === undefined || result === null
        ? 'Done'
        : typeof result === 'string'
          ? result
          : JSON.stringify(result, null, 2);
    eventLog.add(title, message);
    if (alertsSuccess) {
      Alert.alert(title, message);
    }
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const message = error instanceof Error ? error.message : String(error);
    eventLog.add(`${title} failed`, code ? `${code} ${message}` : message);
    Alert.alert(`${title} failed`, code ? `${code}\n${message}` : message);
  }
}

/**
 * Opens an SDK screen, alerting only failures; the event log gets the result.
 * On iOS the call resolves once the screen shows, and an alert would cover
 * it. Over the prescription scanner, the alert's window can even crash the
 * SDK while it starts the camera.
 */
export function runLaunch(title: string, action: () => Promise<unknown>) {
  return runAction(title, action, undefined, { alertsSuccess: false });
}
