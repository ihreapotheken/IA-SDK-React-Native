import { NativeEventEmitter, Platform } from 'react-native';
import type { NativeModule } from 'react-native';
import type {
  IaButtonConfiguration,
  IaModule,
  InitConfig,
  GuestUserData,
  UserAddress,
  AnyIaModule,
  IaSdkSubscription,
  IaSdkPrerequisitesResult,
  IaSdkLoggedAnalyticsEvent,
  IaSdkLogMessage,
  IaApofinderPharmacyChange,
} from '@ihreapotheken/ia-sdk-interface';
import {
  IaBaseModule,
  IaSdkInitializationState,
  IaSdkNavigationTarget,
  ServerEnvironment,
} from '@ihreapotheken/ia-sdk-interface';
import IaSdkCoreNative from './NativeIaSdkCore';
import { IaSdkEvents, IaSdkRequestTypes, IaSdkScreens } from './events';

// Re-export types from interface package
export {
  IaBaseModule,
  ServerEnvironment,
  Salutation,
  PrescriptionInsuranceType,
  IaProductDisplayType,
  IaSdkInitializationState,
  IaSdkNavigationTarget,
  IaSdkScreenViewId,
  IaSdkScreenEmbedStyle,
  IaHeaderStyle,
  IaSdkQaFeature,
  IaTransferPrescriptionsFinishAction,
  IaPrescriptionScannerType,
  IaSdkAnalyticsEventNames,
  IaSdkAnalyticsParameterNames,
  IaSdkAnalyticsScreenNames,
  // CardLink enums
  IaCardLinkFlowType,
  IaCardLinkConsentStatus,
  IaCardLinkConsentEvent,
  IaCardLinkEvent,
  IaCardLinkEnvironment,
  IaCardLinkFinishAction,
  IaCardLinkIllustrationColor,
  IaCardLinkSessionMockResponse,
  IaCardLinkVerificationMockResponse,
} from '@ihreapotheken/ia-sdk-interface';

// Native UI plumbing for inline SDK components and embedded SDK screens.
export { IaSdkPlatformView, IaSdkScreenView } from './IaSdkPlatformView';
export type {
  IaSdkPlatformViewProps,
  IaSdkScreenViewProps,
} from './IaSdkPlatformView';
export type {
  IaModule,
  InitConfig,
  GuestUserData,
  UserAddress,
  TransferPrescriptionsParams,
  PdfPrescription,
  CartState,
  CartProduct,
  CartDetails,
  CartDetailsOptions,
  TransactionSignatures,
  ProductSearchOptions,
  IaCardLinkModule,
  IaOrderingModule,
  IaOverTheCounterModule,
  IaPharmacyModule,
  IaPrescriptionModule,
  AnyIaModule,
  IaSdkSubscription,
  IaSdkPrerequisitesResult,
  IaSdkLoggedAnalyticsEvent,
  IaSdkLogMessage,
  IaApofinderPharmacyChange,
  IaPrerequisitesConfiguration,
  IaInitializationConfiguration,
  IaFooterConfiguration,
  IaHeaderConfiguration,
  IaButtonConfiguration,
  IaUIConfiguration,
  IaQaConfiguration,
  IaQaMockSdkFeatures,
  IaQaMockBundlePermissions,
  IaQaMockForceUpdate,
  IaCardLinkConfiguration,
  IaPharmacy,
  IaPrescriptionScanDecision,
  IaEPrescriptionScan,
  IaScannerCameraState,
  // CardLink types
  IaCardLinkLaunchOptions,
  IaCardLinkSession,
  IaCardLinkSavedCard,
  IaCardLinkUpdateCardParams,
  IaCardLinkMocks,
  IaCardLinkEventSubscription,
} from '@ihreapotheken/ia-sdk-interface';

// ============================================================================
// Native event plumbing
// ============================================================================

// On iOS the core module is an RCTEventEmitter, which only sends events while
// JS listens; on Android events reach RCTDeviceEventEmitter directly.
const nativeEventEmitter = new NativeEventEmitter(
  Platform.OS === 'ios' ? (IaSdkCoreNative as unknown as NativeModule) : undefined
);

type RequestHandler = (
  payload: any
) => Promise<object | null | undefined> | object | null | undefined;

const requestHandlers = new Map<string, RequestHandler>();

// A JS reload keeps the native module, which could still have handlers
// enabled from the previous JS context.
for (const type of Object.values(IaSdkRequestTypes)) {
  IaSdkCoreNative.setRequestHandlerEnabled(type, false);
}

// Always subscribed, so the iOS emitter sends events from the start.
nativeEventEmitter.addListener(
  IaSdkEvents.REQUEST,
  async (event: { requestId?: string; type: string; payload: any }) => {
    let response: object | null = null;
    const handler = requestHandlers.get(event.type);
    if (handler) {
      try {
        response = (await handler(event.payload ?? {})) ?? null;
      } catch (error) {
        // The native side then uses the SDK default.
        console.warn(`[IaSdk] ${event.type} handler failed:`, error);
      }
    }
    if (event.requestId) {
      IaSdkCoreNative.respondToRequest(event.requestId, response);
    }
  }
);

function addNativeEventListener<T>(
  eventName: string,
  callback: (data: T) => void
): IaSdkSubscription {
  const subscription = nativeEventEmitter.addListener(eventName, callback);
  return { remove: () => subscription.remove() };
}

function setRequestHandler(type: string, handler: RequestHandler | null) {
  if (handler) {
    requestHandlers.set(type, handler);
  } else {
    requestHandlers.delete(type);
  }
  IaSdkCoreNative.setRequestHandlerEnabled(type, handler != null);
}

function launchScreen(
  screen: string,
  options?: { [key: string]: unknown }
): Promise<void> {
  return IaSdkCoreNative.launchScreen(screen, options ?? null);
}

/**
 * Logs that a method isn't available on the current platform. Such methods
 * resolve without doing anything there.
 */
export function warnUnsupported(
  tag: string,
  method: string,
  platform: 'ios' | 'android'
): boolean {
  if (Platform.OS === platform) {
    return false;
  }
  console.warn(
    `[${tag}] ${method} is only supported on ${platform === 'ios' ? 'iOS' : 'Android'}`
  );
  return true;
}

/**
 * Plumbing shared with the ia.de module packages.
 *
 * @internal Not part of the public API; it may change in any release.
 */
export const IaSdkInternal = {
  events: IaSdkEvents,
  requestTypes: IaSdkRequestTypes,
  screens: IaSdkScreens,
  addEventListener: addNativeEventListener,
  setRequestHandler,
  launchScreen,
  setPrescriptionScannerCameraState: (state: {
    isOn?: boolean;
    isFlashlightOn?: boolean;
    isPreviewPaused?: boolean;
  }): Promise<void> =>
    IaSdkCoreNative.setPrescriptionScannerCameraState!({
      isOn: state.isOn ?? null,
      isFlashlightOn: state.isFlashlightOn ?? null,
      isPreviewPaused: state.isPreviewPaused ?? null,
    }),
};

// ============================================================================
// IaSdk
// ============================================================================

const DEFAULT_PREREQUISITES = {
  isCancellable: true,
  isAnimated: true,
  runLegalIfNeeded: true,
  runOnboardingIfNeeded: false,
  runApofinderIfNeeded: true,
};

/**
 * Main entrypoint for the ia.de AppSDK services and features.
 *
 * Methods documented as "iOS only" or "Android only" log a warning and do
 * nothing on the other platform.
 */
export class IaSdk {
  private static _instance: IaSdk;

  private accessKey: string | null = null;
  private initialized = false;
  private modulesRegistered = false;
  private pendingRegistration: Promise<void> | null = null;
  private pendingInitialization: Promise<void> | null = null;
  private navigationHandler:
    | ((target: IaSdkNavigationTarget) => boolean | Promise<boolean>)
    | null = null;
  private backActionHandler: (() => boolean | Promise<boolean>) | null = null;
  private logMessageListenerCount = 0;

  private registeredModules: Map<IaBaseModule, IaModule> = new Map();

  private constructor() {}

  /**
   * Globally-accessible singleton class instance.
   */
  static get instance(): IaSdk {
    if (!IaSdk._instance) {
      IaSdk._instance = new IaSdk();
    }
    return IaSdk._instance;
  }

  /**
   * Register a collection of specified modules for client integration.
   *
   * Pass all modules in one call, before `initialize`: the Android SDK only
   * starts the modules registered before it initializes. Later calls have no
   * effect.
   *
   * @param modules Array of module instances to register
   */
  async register(modules: IaModule[]): Promise<void> {
    if (this.pendingRegistration) {
      await this.pendingRegistration.catch(() => undefined);
    }
    if (this.modulesRegistered) {
      return;
    }
    if (this.initialized || this.pendingInitialization) {
      throw new Error(
        'Call iaSdk.register before initialize: the Android SDK only starts the modules registered before it initializes.'
      );
    }

    const registration = (async () => {
      for (const module of modules) {
        await module.register();
        this.registeredModules.set(module.moduleType, module);
      }
      this.modulesRegistered = true;
    })();
    this.pendingRegistration = registration;
    try {
      await registration;
    } finally {
      this.pendingRegistration = null;
    }
  }

  /**
   * Get a registered module by type.
   *
   * @param type The module type to retrieve
   * @throws Error if the module is not registered
   */
  getModule<T extends AnyIaModule>(type: T['moduleType']): T {
    const module = this.registeredModules.get(type);
    if (!module) {
      throw new Error(
        `Module ${type} not initialized. Ensure the object is instantiated and forwarded to the "register" method.`
      );
    }
    return module as T;
  }

  /**
   * Check if a module is registered.
   *
   * @param type The module type to check
   */
  hasModule(type: IaBaseModule): boolean {
    return this.registeredModules.has(type);
  }

  /**
   * Allocate the resources required for the ia.de SDK runtime execution.
   *
   * The method must be called before accessing any additional SDK resources.
   * Only the first successful call has an effect; a call made while another
   * one runs completes with it. An empty `accessKey` or `clientId` rejects
   * with `ARG_ERROR`.
   *
   * @param config SDK initialization configuration
   */
  async initialize(config: InitConfig): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (this.pendingInitialization) {
      return this.pendingInitialization;
    }
    const initialization = this.runInitialization(config);
    this.pendingInitialization = initialization;
    try {
      await initialization;
    } finally {
      this.pendingInitialization = null;
    }
  }

  private async runInitialization(config: InitConfig): Promise<void> {
    if (this.pendingRegistration) {
      await this.pendingRegistration.catch(() => undefined);
    }
    if (!config.accessKey?.trim() || !config.clientId?.trim()) {
      throw createError('ARG_ERROR', 'accessKey and clientId must not be empty.');
    }

    await IaSdkCoreNative.initialize({
      accessKey: config.accessKey,
      clientId: config.clientId,
      serverEnvironment: config.serverEnvironment,
      shouldFetchThemeFromRemote: config.shouldFetchThemeFromRemote ?? false,
      channelId: config.channelId ?? null,
      footer: {
        shouldShowAppSettings: config.footer?.shouldShowAppSettings ?? true,
        shouldShowImprint: config.footer?.shouldShowImprint ?? true,
        isImprintHandledByHostApp:
          config.footer?.isImprintHandledByHostApp ?? false,
      },
      initialization: {
        shouldShowIndicator:
          config.initialization?.shouldShowIndicator ?? false,
        prerequisites: {
          ...DEFAULT_PREREQUISITES,
          ...stripUndefined(config.initialization?.prerequisites ?? {}),
        },
      },
      uiConfiguration: {
        supportsLiquidGlass:
          config.uiConfiguration?.supportsLiquidGlass ?? false,
        shouldShowMascotIllustrations:
          config.uiConfiguration?.shouldShowMascotIllustrations ?? true,
        header: {
          style: config.uiConfiguration?.header?.style ?? 'duotone',
          primaryColor: config.uiConfiguration?.header?.primaryColor ?? null,
          secondaryColor:
            config.uiConfiguration?.header?.secondaryColor ?? null,
        },
        primaryButton: buttonConfig(config.uiConfiguration?.primaryButton),
        secondaryButton: buttonConfig(config.uiConfiguration?.secondaryButton),
      },
      isPickupLockerAndCourierShippingEnabled:
        config.isPickupLockerAndCourierShippingEnabled ?? null,
      appStoreId: config.appStoreId ?? null,
      playStoreId: config.playStoreId ?? null,
      isAnalyticsEnabled: config.isAnalyticsEnabled ?? null,
      isHapticFeedbackEnabled: config.isHapticFeedbackEnabled ?? null,
      qaConfiguration: config.qaConfiguration
        ? {
            showTestPharmaciesInApofinder:
              config.qaConfiguration.showTestPharmaciesInApofinder ?? false,
            features: config.qaConfiguration.features ?? [],
            apofinderCustomPharmacyId:
              config.qaConfiguration.apofinderCustomPharmacyId ?? null,
            maxScrollSpeed: config.qaConfiguration.maxScrollSpeed ?? null,
            mockSdkFeatures: config.qaConfiguration.mockSdkFeatures ?? null,
            mockBundlePermissions:
              config.qaConfiguration.mockBundlePermissions ?? null,
            mockForceUpdate: config.qaConfiguration.mockForceUpdate ?? null,
          }
        : null,
      cardLink: config.cardLink
        ? {
            isSaveCardEnabled: config.cardLink.isSaveCardEnabled ?? null,
            userId: config.cardLink.userId ?? null,
            phoneNumber: config.cardLink.phoneNumber ?? null,
          }
        : null,
      hostAppLogFilePath: config.hostAppLogFilePath ?? null,
    });

    this.accessKey = config.accessKey;
    this.initialized = true;

    // Android only attaches the host log file to CardLink, so it's forwarded
    // to the CardLink module. A failure only affects CardLink problem reports.
    const hostAppLogFilePath = config.hostAppLogFilePath;
    const cardLink = this.registeredModules.get(IaBaseModule.CardLink) as
      | { setHostAppLogFilePath?: (path: string) => Promise<void> }
      | undefined;
    if (Platform.OS === 'android' && hostAppLogFilePath && cardLink) {
      cardLink.setHostAppLogFilePath?.(hostAppLogFilePath).catch((error) => {
        console.warn('[IaSdk] Forwarding the host app log file to CardLink failed:', error);
      });
    }
  }

  /**
   * Resets the user data and onboarding status (pharmacy selection, user
   * consents statuses) and empties the cart.
   */
  async logout(): Promise<void> {
    return IaSdkCoreNative.logout();
  }

  /**
   * Forwards the client personal information to the ia.de library for checkout purposes.
   *
   * @param data Guest user data for checkout
   */
  async setGuestUserData(data: GuestUserData): Promise<void> {
    return IaSdkCoreNative.setGuestUserData({
      salutation: data.salutation,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumberCountryCode: String(data.phoneNumberCountryCode),
      phoneNumberWithoutCountryCode: String(data.phoneNumberWithoutCountryCode),
    });
  }

  /**
   * Launches the dashboard screen on top of the navigation stack.
   */
  async startDashboardActivity(): Promise<void> {
    if (this.accessKey === null) {
      throw new Error('initialize method not invoked.');
    }
    return launchScreen(IaSdkScreens.START);
  }

  /**
   * Launches the Apofinder (pharmacy finder) screen on top of the navigation stack.
   *
   * The selected pharmacy is reported through
   * `addApofinderPharmacyChangedListener`.
   *
   * @param options.isCancellable Whether the user can close Apofinder without
   * selecting a pharmacy (iOS). Defaults to `true`.
   */
  async launchApofinder(options?: { isCancellable?: boolean }): Promise<void> {
    return launchScreen(IaSdkScreens.APOFINDER, {
      isCancellable: options?.isCancellable ?? true,
    });
  }

  /**
   * Closes the ia.de screens shown on top of the app, including screens the
   * SDK opened from them. Screens the host app presented stay open.
   */
  async finishAllActivities(): Promise<void> {
    return IaSdkCoreNative.finishAllActivities();
  }

  /**
   * Transfers user data from SDK v1 to the current SDK.
   *
   * This method is intended to be invoked before the `initialize` method.
   */
  async transferSDKv1UserData(): Promise<void> {
    return IaSdkCoreNative.transferSDKv1UserData();
  }

  /**
   * Legacy setup required when the host app is the ia.de Core app.
   *
   * Only has an effect on iOS, where it registers the Integrations module and
   * marks the SDK as running in the Core app. On Android it does nothing.
   */
  async legacySetupAsCoreApp(): Promise<void> {
    return IaSdkCoreNative.legacySetupAsCoreApp();
  }

  /**
   * Checks whether the SDK has been initialized.
   *
   * @returns True if the SDK is initialized, false otherwise.
   */
  async isInitialized(): Promise<boolean> {
    return IaSdkCoreNative.isInitialized();
  }

  /**
   * Returns the current initialization state, see also
   * `addInitializationStateListener`.
   */
  async getInitializationState(): Promise<IaSdkInitializationState> {
    const state = await IaSdkCoreNative.getInitializationState();
    return toInitializationState(state);
  }

  /**
   * Deletes the user data the SDK stores on the device (iOS only).
   */
  async deleteUser(): Promise<void> {
    if (warnUnsupported('IaSdk', 'deleteUser', 'ios')) return;
    return IaSdkCoreNative.deleteUser!();
  }

  /**
   * Gets the current server environment. Before `initialize` it's the SDK
   * default, production.
   */
  async getEnvironment(): Promise<ServerEnvironment> {
    return (await IaSdkCoreNative.getEnvironment()) as ServerEnvironment;
  }

  /**
   * Cleans the SDK cache (iOS only). With `initialization`, the next
   * `initialize` call initializes the SDK again.
   *
   * @param initialization Whether to clean initialization cache.
   * @param prerequisites Whether to clean prerequisites cache.
   */
  async cleanCache(
    initialization: boolean,
    prerequisites: boolean
  ): Promise<void> {
    if (warnUnsupported('IaSdk', 'cleanCache', 'ios')) return;
    await IaSdkCoreNative.cleanCache!(initialization, prerequisites);
    if (initialization) {
      this.initialized = false;
    }
  }

  /**
   * Toggles the Pharmi mascot illustrations at runtime (iOS only).
   *
   * Takes effect on screens rendered after the call. On Android configure it
   * through `uiConfiguration.shouldShowMascotIllustrations` in `initialize`.
   *
   * @param shouldShowMascotIllustrations Whether the mascot is rendered.
   */
  async setShouldShowMascotIllustrations(
    shouldShowMascotIllustrations: boolean
  ): Promise<void> {
    if (warnUnsupported('IaSdk', 'setShouldShowMascotIllustrations', 'ios')) {
      return;
    }
    return IaSdkCoreNative.setShouldShowMascotIllustrations!(
      shouldShowMascotIllustrations
    );
  }

  /**
   * Sets the user's billing address, used to pre-fill the checkout flow.
   *
   * The phone number is only stored when both phone fields are set.
   *
   * @param address The billing address to set.
   */
  async setUserBillingAddress(address: UserAddress): Promise<void> {
    return IaSdkCoreNative.setUserBillingAddress(addressToNative(address));
  }

  /**
   * Sets the user's delivery address, used to pre-fill the checkout flow.
   *
   * The phone number is only stored when both phone fields are set.
   *
   * @param address The delivery address to set.
   */
  async setUserDeliveryAddress(address: UserAddress): Promise<void> {
    return IaSdkCoreNative.setUserDeliveryAddress(addressToNative(address));
  }

  /**
   * Removes the billing address set with `setUserBillingAddress`.
   */
  async clearUserBillingAddress(): Promise<void> {
    return IaSdkCoreNative.clearUserBillingAddress();
  }

  /**
   * Removes the delivery address set with `setUserDeliveryAddress`.
   */
  async clearUserDeliveryAddress(): Promise<void> {
    return IaSdkCoreNative.clearUserDeliveryAddress();
  }

  /**
   * Resets the prerequisites state, so the SDK runs the prerequisites flow
   * (legal documents, onboarding, pharmacy selection) again the next time
   * it's required. The selected pharmacy is cleared too.
   */
  async resetPrerequisites(): Promise<void> {
    return IaSdkCoreNative.resetPrerequisites();
  }

  /**
   * Resets only the accepted legal documents (iOS only).
   */
  async resetLegalDisclaimer(): Promise<void> {
    if (warnUnsupported('IaSdk', 'resetLegalDisclaimer', 'ios')) return;
    return IaSdkCoreNative.resetLegalDisclaimer!();
  }

  /**
   * Resets the user's analytics consent answer, so the legal screen asks
   * again.
   */
  async resetAnalyticsConsent(): Promise<void> {
    return IaSdkCoreNative.resetAnalyticsConsent();
  }

  /**
   * Marks the onboarding as shown or not shown (iOS only).
   */
  async setIsOnboardingShown(isOnboardingShown: boolean): Promise<void> {
    if (warnUnsupported('IaSdk', 'setIsOnboardingShown', 'ios')) return;
    return IaSdkCoreNative.setIsOnboardingShown!(isOnboardingShown);
  }

  /**
   * Returns whether `launchPrerequisiteFlow` would finish without showing a
   * screen. Call it after `initialize`.
   */
  async isPrerequisiteFlowCompleted(): Promise<boolean> {
    return IaSdkCoreNative.isPrerequisiteFlowCompleted();
  }

  /**
   * Runs the prerequisites flow (legal documents, onboarding, pharmacy
   * selection) and resolves once the user finished or cancelled it. Resolves
   * right away when the prerequisites are completed.
   *
   * Call it after `initialize`. A call made while the flow runs rejects with
   * `PREREQUISITE_FLOW_IN_PROGRESS`.
   */
  async launchPrerequisiteFlow(): Promise<IaSdkPrerequisitesResult> {
    const result = (await IaSdkCoreNative.launchPrerequisiteFlow()) as {
      isCancelled?: boolean;
    };
    return { isCancelled: result?.isCancelled === true };
  }

  /**
   * Turns haptic feedback in SDK screens on or off (Android only).
   */
  async setHapticFeedbackEnabled(isEnabled: boolean): Promise<void> {
    if (warnUnsupported('IaSdk', 'setHapticFeedbackEnabled', 'android')) {
      return;
    }
    return IaSdkCoreNative.setHapticFeedbackEnabled!(isEnabled);
  }

  /**
   * Presents the SDK's log viewer, for debugging an integration.
   */
  async presentLogs(): Promise<void> {
    return IaSdkCoreNative.presentLogs();
  }

  /**
   * Writes the SDK's logs to a file and returns its path (Android only).
   */
  async exportLogs(): Promise<string | null> {
    if (warnUnsupported('IaSdk', 'exportLogs', 'android')) return null;
    return IaSdkCoreNative.exportLogs!();
  }

  /**
   * Returns the SDK's identifier for the current user (iOS only).
   */
  async getUserId(): Promise<string | null> {
    if (warnUnsupported('IaSdk', 'getUserId', 'ios')) return null;
    return IaSdkCoreNative.getUserId!();
  }

  /**
   * Removes the SDK's cached image responses (iOS only).
   */
  async removeAllCachedResponses(): Promise<void> {
    if (warnUnsupported('IaSdk', 'removeAllCachedResponses', 'ios')) return;
    return IaSdkCoreNative.removeAllCachedResponses!();
  }

  // --------------------------------------------------------------------------
  // Listeners
  // --------------------------------------------------------------------------

  /**
   * Adds a listener for initialization state changes. Changes before the
   * listener was added aren't replayed; see `getInitializationState`.
   */
  addInitializationStateListener(
    callback: (state: IaSdkInitializationState) => void
  ): IaSdkSubscription {
    return addNativeEventListener<{ state: string }>(
      IaSdkEvents.INITIALIZATION_STATE_CHANGED,
      (event) => callback(toInitializationState(event.state))
    );
  }

  /**
   * Adds a listener for analytics events the SDK logs for the host app.
   *
   * Events are only logged when the client has analytics enabled in the
   * SDK's CMS and the user accepted it; on Android also
   * `isAnalyticsEnabled`, on by default.
   */
  addAnalyticsEventListener(
    callback: (event: IaSdkLoggedAnalyticsEvent) => void
  ): IaSdkSubscription {
    return addNativeEventListener<IaSdkLoggedAnalyticsEvent>(
      IaSdkEvents.ANALYTICS_EVENT,
      (event) =>
        callback({ name: event.name, parameters: event.parameters ?? {} })
    );
  }

  /**
   * Adds a listener for messages the SDK logs (iOS only). Messages are only
   * forwarded while a listener is added.
   */
  addLogMessageListener(
    callback: (message: IaSdkLogMessage) => void
  ): IaSdkSubscription {
    const subscription = addNativeEventListener<IaSdkLogMessage>(
      IaSdkEvents.LOG_MESSAGE,
      callback
    );
    if (Platform.OS !== 'ios') {
      return subscription;
    }
    this.logMessageListenerCount += 1;
    if (this.logMessageListenerCount === 1) {
      IaSdkCoreNative.setLogMessageForwardingEnabled?.(true);
    }
    let isRemoved = false;
    return {
      remove: () => {
        if (isRemoved) return;
        isRemoved = true;
        subscription.remove();
        this.logMessageListenerCount -= 1;
        if (this.logMessageListenerCount === 0) {
          IaSdkCoreNative.setLogMessageForwardingEnabled?.(false);
        }
      },
    };
  }

  /**
   * Adds a listener for pharmacies the user selects in Apofinder.
   *
   * On Android only pharmacies selected in the screen opened with
   * `launchApofinder` are reported.
   */
  addApofinderPharmacyChangedListener(
    callback: (change: IaApofinderPharmacyChange) => void
  ): IaSdkSubscription {
    return addNativeEventListener<IaApofinderPharmacyChange>(
      IaSdkEvents.APOFINDER_PHARMACY_CHANGED,
      callback
    );
  }

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  /**
   * Called when the SDK is about to navigate to a destination the host app
   * can take over. Return `true` to let the SDK proceed, `false` when the
   * host app handled it.
   *
   * On Android the SDK waits at most 500 ms for the answer and then proceeds
   * itself, so answer without awaiting slow work. Set `null` to remove.
   */
  get onSdkWillNavigateToTarget():
    | ((target: IaSdkNavigationTarget) => boolean | Promise<boolean>)
    | null {
    return this.navigationHandler;
  }

  set onSdkWillNavigateToTarget(
    handler:
      | ((target: IaSdkNavigationTarget) => boolean | Promise<boolean>)
      | null
  ) {
    this.navigationHandler = handler;
    setRequestHandler(
      IaSdkRequestTypes.NAVIGATION,
      handler
        ? async (payload: { navigationTarget: string }) => {
            const shouldProceed = await handler(
              payload.navigationTarget as IaSdkNavigationTarget
            );
            return { handled: shouldProceed === false };
          }
        : null
    );
  }

  /**
   * Called before an SDK screen opened from the host app closes (Android
   * only). Return `true` to close it, `false` to keep it open. Without an
   * answer within 5 seconds the screen closes. `finishAllActivities` always
   * closes without asking. Set `null` to remove.
   */
  get onSdkBackAction(): (() => boolean | Promise<boolean>) | null {
    return this.backActionHandler;
  }

  set onSdkBackAction(handler: (() => boolean | Promise<boolean>) | null) {
    this.backActionHandler = handler;
    setRequestHandler(
      IaSdkRequestTypes.BACK_ACTION,
      handler
        ? async () => ({ shouldClose: (await handler()) !== false })
        : null
    );
  }
}

// ============================================================================
// Helpers
// ============================================================================

function createError(code: string, message: string): Error {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function buttonConfig(
  button?: IaButtonConfiguration
): { [key: string]: number | null } {
  const keys = [
    'backgroundColor',
    'backgroundDisabledColor',
    'textColor',
    'textDisabledColor',
    'borderColor',
    'borderDisabledColor',
    'borderWidth',
    'borderRadius',
  ];
  const result: { [key: string]: number | null } = {};
  for (const key of keys) {
    const value = (button as { [key: string]: number | undefined } | undefined)?.[key];
    if (value !== undefined && !Number.isFinite(value)) {
      throw createError('ARG_ERROR', `uiConfiguration ${key} must be a finite number.`);
    }
    result[key] = value ?? null;
  }
  return result;
}

function addressToNative(address: UserAddress): { [key: string]: unknown } {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    additionalInfo: address.additionalInfo ?? null,
    street: address.street,
    houseNumber: address.houseNumber,
    zipCode: address.zipCode,
    city: address.city,
    salutation: address.salutation ?? null,
    phoneNumberCountryCode: address.phoneNumberCountryCode ?? null,
    phoneNumberWithoutCountryCode: address.phoneNumberWithoutCountryCode ?? null,
  };
}

function toInitializationState(state: string): IaSdkInitializationState {
  return (Object.values(IaSdkInitializationState) as string[]).includes(state)
    ? (state as IaSdkInitializationState)
    : IaSdkInitializationState.Uninitialized;
}

/**
 * Singleton instance of the IaSdk class.
 */
export const iaSdk = IaSdk.instance;
