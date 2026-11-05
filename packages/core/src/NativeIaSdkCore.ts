import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Native spec of the core module. Internal to this package; the public API is
 * the `IaSdk` class in `index.tsx`.
 *
 * Optional methods are only implemented on one platform (see the comments),
 * and the JS side only calls them there.
 */
export interface Spec extends TurboModule {
  // Event emitter plumbing (RCTEventEmitter on iOS, no-op on Android).
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  // Native-to-JS requests, see `IaSdkEvents.REQUEST`. Native only sends a
  // request type while JS has a handler enabled for it.
  setRequestHandlerEnabled(type: string, enabled: boolean): void;
  respondToRequest(requestId: string, response: Object | null): void;

  initialize(config: Object): Promise<void>;
  logout(): Promise<void>;
  setGuestUserData(data: Object): Promise<void>;
  setUserBillingAddress(address: Object): Promise<void>;
  setUserDeliveryAddress(address: Object): Promise<void>;
  clearUserBillingAddress(): Promise<void>;
  clearUserDeliveryAddress(): Promise<void>;
  /**
   * Presents an SDK screen. `screen` is one of `IaSdkScreens`; `options` may
   * carry `isCancellable` (apofinder) and `focusesOnAppear` (search).
   */
  launchScreen(screen: string, options: Object | null): Promise<void>;
  finishAllActivities(): Promise<void>;
  transferSDKv1UserData(): Promise<void>;
  isInitialized(): Promise<boolean>;
  getInitializationState(): Promise<string>;
  getEnvironment(): Promise<string>;
  resetPrerequisites(): Promise<void>;
  resetAnalyticsConsent(): Promise<void>;
  isPrerequisiteFlowCompleted(): Promise<boolean>;
  /** Resolves with `{ isCancelled: boolean }`. */
  launchPrerequisiteFlow(): Promise<Object>;
  presentLogs(): Promise<void>;
  /** Only has an effect on iOS; resolves right away on Android. */
  legacySetupAsCoreApp(): Promise<void>;

  // iOS only
  deleteUser?(): Promise<void>;
  cleanCache?(initialization: boolean, prerequisites: boolean): Promise<void>;
  setShouldShowMascotIllustrations?(value: boolean): Promise<void>;
  resetLegalDisclaimer?(): Promise<void>;
  setIsOnboardingShown?(value: boolean): Promise<void>;
  getUserId?(): Promise<string | null>;
  removeAllCachedResponses?(): Promise<void>;
  setLogMessageForwardingEnabled?(enabled: boolean): void;
  /**
   * Camera state of the scanner `launchScreen` opened: `{ isOn?,
   * isFlashlightOn?, isPreviewPaused? }`. Unset values stay unchanged.
   */
  setPrescriptionScannerCameraState?(state: Object): Promise<void>;

  // Android only
  setHapticFeedbackEnabled?(enabled: boolean): Promise<void>;
  exportLogs?(): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkCore');
