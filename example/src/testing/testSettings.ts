import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import {
  iaSdk,
  IaBaseModule,
  type IaSdkSubscription,
  type IaPrescriptionModule,
  type IaPrescriptionScanDecision,
} from '@ihreapotheken/ia-sdk-core';
import { describe, eventLog } from './eventLog';

/** How the example app answers the prescription scan callbacks. */
export type ExampleScanDecision = 'performDefault' | 'handled' | 'error';

export interface ExampleTestSettings {
  /** `onSdkWillNavigateToTarget` reports every target as handled, so the SDK doesn't navigate. */
  handlesNavigation: boolean;
  /** `onSdkBackAction` keeps SDK screens open (Android). */
  blocksBackAction: boolean;
  /** The answer to the prescription scan callbacks. */
  scanDecision: ExampleScanDecision;
  /** Adds the SDK's own log messages to the event log (iOS). */
  logsSdkMessages: boolean;
}

let settings: ExampleTestSettings = {
  handlesNavigation: false,
  blocksBackAction: false,
  scanDecision: 'performDefault',
  logsSdkMessages: false,
};
const listeners = new Set<() => void>();
let logMessageSubscription: IaSdkSubscription | null = null;

function scanDecision(): IaPrescriptionScanDecision {
  switch (settings.scanDecision) {
    case 'handled':
      return { decision: 'handled' };
    case 'error':
      return { decision: 'error', message: 'Rejected by the example app.' };
    default:
      return { decision: 'performDefault' };
  }
}

/**
 * Sets the SDK callbacks the Events tab switches. Called once the modules are
 * registered, as the scan callbacks belong to the prescription module.
 */
export function installHostCallbacks() {
  iaSdk.onSdkWillNavigateToTarget = (target) => {
    eventLog.add(
      'Navigation',
      `${target} → ${settings.handlesNavigation ? 'handled by host' : 'SDK default'}`
    );
    return !settings.handlesNavigation;
  };

  if (Platform.OS === 'android') {
    iaSdk.onSdkBackAction = () => {
      eventLog.add(
        'Back action',
        settings.blocksBackAction ? 'kept open' : 'closes'
      );
      return !settings.blocksBackAction;
    };
  }

  if (iaSdk.hasModule(IaBaseModule.Prescription)) {
    const prescription = iaSdk.getModule<IaPrescriptionModule>(
      IaBaseModule.Prescription
    );
    prescription.onPrescriptionPhotoScanned = async (imageBase64) => {
      eventLog.add(
        'Prescription photo',
        `${Math.round((imageBase64.length * 3) / 4 / 1024)} KB → ${settings.scanDecision}`
      );
      return scanDecision();
    };
    prescription.onEPrescriptionScanned = async (scan) => {
      eventLog.add(
        'E-prescription',
        `${describe(scan.urls)} → ${settings.scanDecision}`
      );
      return scanDecision();
    };
  }
}

export function updateTestSettings(update: Partial<ExampleTestSettings>) {
  settings = { ...settings, ...update };
  if (update.logsSdkMessages !== undefined) {
    if (update.logsSdkMessages && !logMessageSubscription) {
      logMessageSubscription = iaSdk.addLogMessageListener((message) =>
        eventLog.add('SDK log', `${message.level}: ${message.message}`)
      );
    } else if (!update.logsSdkMessages && logMessageSubscription) {
      logMessageSubscription.remove();
      logMessageSubscription = null;
    }
  }
  listeners.forEach((listener) => listener());
}

export function useTestSettings(): ExampleTestSettings {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => settings
  );
}
