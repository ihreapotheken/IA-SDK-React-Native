import { NativeEventEmitter, Platform } from 'react-native';
import type { NativeModule } from 'react-native';
import type {
  IaCardLinkModule,
  IaCardLinkLaunchOptions,
  IaCardLinkMocks,
  IaCardLinkSavedCard,
  IaCardLinkSession,
  IaCardLinkEventSubscription,
  IaCardLinkUpdateCardParams,
} from '@ihreapotheken/ia-sdk-interface';
import {
  IaBaseModule,
  IaCardLinkConsentEvent,
  IaCardLinkEvent,
  IaCardLinkEnvironment,
} from '@ihreapotheken/ia-sdk-interface';
import { warnUnsupported } from '@ihreapotheken/ia-sdk-core';
import IaSdkCardLinkNative from './NativeIaSdkCardLink';
import { CardLinkEvents } from './constants';

/** Payload of `CardLinkEvents.CONSENT_EVENT`. */
type ConsentPayload = { status: string; phoneNumber?: string | null } | string;

/** Payload of `CardLinkEvents.EVENT`. */
type EventPayload =
  | {
      event: string;
      cards?: Array<{ [key: string]: unknown }> | null;
      errorMessage?: string | null;
      result?: string | null;
    }
  | string;

function eventName(payload: EventPayload): string {
  return typeof payload === 'string' ? payload : payload.event;
}

function toSavedCard(card: { [key: string]: unknown }): IaCardLinkSavedCard {
  return {
    name: card.name as string,
    // Native card JSON calls the CAN code "canNumber".
    canCode: ((card.canCode ?? card.canNumber) as string | undefined) ?? null,
    id: (card.id as string | undefined) ?? null,
    phoneNumber: (card.phoneNumber as string | undefined) ?? null,
  };
}

/**
 * Implementation of the CardLink module for the ia.de AppSDK.
 * Provides NFC-based prescription transfer functionality.
 *
 * Failed calls reject with an error whose `code` names the failure, for
 * example `GET_SAVED_CARDS_ERROR` or `DELETE_CARD_ERROR`; `launch` rejects
 * with `NO_ACTIVITY` (Android) or `NO_VIEW_CONTROLLER` (iOS) without a screen
 * to show CardLink on.
 */
export class IaModuleCardLink implements IaCardLinkModule {
  readonly moduleType = IaBaseModule.CardLink;

  // On iOS the module is an RCTEventEmitter, which needs the listener count;
  // on Android events reach RCTDeviceEventEmitter directly.
  private eventEmitter = new NativeEventEmitter(
    Platform.OS === 'ios'
      ? (IaSdkCardLinkNative as unknown as NativeModule)
      : undefined
  );

  async register(): Promise<void> {
    IaSdkCardLinkNative.registerModule();
  }

  async launch(options: IaCardLinkLaunchOptions): Promise<void> {
    return IaSdkCardLinkNative.launch({
      sdkApiKey: options.sdkApiKey,
      flowType: options.flowType,
      pharmacyId: options.pharmacyId,
      consentStatus: options.consentStatus,
      phoneNumber: options.phoneNumber,
      userId: options.userId,
      canCode: options.canCode ?? null,
      cardName: options.cardName ?? null,
      primaryColor: options.primaryColor ?? null,
      buttonsColor: options.buttonsColor ?? null,
      textLinkColor: options.textLinkColor ?? null,
      bottomNavigationColor: options.bottomNavigationColor ?? null,
      environment: options.environment ?? null,
      saveCardEnabled: options.saveCardEnabled ?? null,
      finishAction: options.finishAction ?? null,
      appId: options.appId ?? null,
      coreAppLogFileURL: options.coreAppLogFileURL ?? null,
      supportsLiquidGlass: options.supportsLiquidGlass ?? null,
      illustrationColor: options.illustrationColor ?? null,
    });
  }

  async getVersion(): Promise<string | null> {
    return IaSdkCardLinkNative.getVersion();
  }

  async getEnvironment(): Promise<IaCardLinkEnvironment> {
    const environment = await IaSdkCardLinkNative.getEnvironment();
    return environment === IaCardLinkEnvironment.Debug
      ? IaCardLinkEnvironment.Debug
      : IaCardLinkEnvironment.Production;
  }

  async getLogFilePath(): Promise<string | null> {
    return IaSdkCardLinkNative.getLogFilePath();
  }

  async getSavedCards(userId: string): Promise<string | null> {
    return IaSdkCardLinkNative.getSavedCards(userId);
  }

  async getSavedCardList(userId: string): Promise<IaCardLinkSavedCard[]> {
    const json = await this.getSavedCards(userId);
    if (!json) {
      return [];
    }
    const cards: unknown = JSON.parse(json);
    if (!Array.isArray(cards)) {
      return [];
    }
    return cards
      .filter(
        (card): card is { [key: string]: unknown } =>
          card != null && typeof card === 'object' && typeof card.name === 'string'
      )
      .map((card) => {
        const savedCard = toSavedCard(card);
        // Android's card JSON uses "id" for the user identifier, not a card identifier.
        return Platform.OS === 'android' ? { ...savedCard, id: null } : savedCard;
      });
  }

  async deleteCard(userId: string, cardName: string): Promise<void> {
    return IaSdkCardLinkNative.deleteCard(userId, cardName);
  }

  async updateCard(params: IaCardLinkUpdateCardParams): Promise<void> {
    if (warnUnsupported('IaModuleCardLink', 'updateCard', 'android')) return;
    return IaSdkCardLinkNative.updateCard!({
      userId: params.userId,
      originalName: params.originalName,
      name: params.name,
      phoneNumber: params.phoneNumber,
      canCode: params.canCode,
    });
  }

  async reorderSavedCards(
    userId: string,
    orderedCanCodes: string[]
  ): Promise<void> {
    if (warnUnsupported('IaModuleCardLink', 'reorderSavedCards', 'android')) {
      return;
    }
    return IaSdkCardLinkNative.reorderSavedCards!(userId, orderedCanCodes);
  }

  async deleteAllCards(): Promise<string | null> {
    return IaSdkCardLinkNative.deleteAllCards();
  }

  async deleteAllUserRelatedData(): Promise<void> {
    return IaSdkCardLinkNative.deleteAllUserRelatedData();
  }

  async setHostAppLogFilePath(path: string): Promise<void> {
    return IaSdkCardLinkNative.setHostAppLogFilePath(path);
  }

  async setMocks(mocks: IaCardLinkMocks): Promise<void> {
    if (warnUnsupported('IaModuleCardLink', 'setMocks', 'ios')) return;
    return IaSdkCardLinkNative.setMocks!({
      isMockingEnabled: mocks.isMockingEnabled ?? true,
      sessionResponse: mocks.sessionResponse ?? null,
      sessionDurationSeconds: mocks.sessionDurationSeconds ?? null,
      sessionWillExpireSoonSeconds: mocks.sessionWillExpireSoonSeconds ?? null,
      verificationResponse: mocks.verificationResponse ?? null,
      ePrescriptionXmls: mocks.ePrescriptionXmls ?? null,
      arePrescriptionsPartiallyMocked:
        mocks.arePrescriptionsPartiallyMocked ?? false,
      isWrongCanMocked: mocks.isWrongCanMocked ?? false,
    });
  }

  /**
   * Programmatically finishes the active CardLink session. Only has an effect
   * on iOS.
   */
  async finish(): Promise<void> {
    return IaSdkCardLinkNative.finish();
  }

  // Event Listeners

  private subscribe<T>(
    name: string,
    callback: (data: T) => void
  ): IaCardLinkEventSubscription {
    const subscription = this.eventEmitter.addListener(name, callback);
    return { remove: () => subscription.remove() };
  }

  addConsentEventListener(
    callback: (event: IaCardLinkConsentEvent) => void
  ): IaCardLinkEventSubscription {
    return this.subscribe<ConsentPayload>(CardLinkEvents.CONSENT_EVENT, (data) =>
      callback(
        (typeof data === 'string' ? data : data.status) as IaCardLinkConsentEvent
      )
    );
  }

  addConsentPhoneNumberListener(
    callback: (phoneNumber: string) => void
  ): IaCardLinkEventSubscription {
    return this.subscribe<ConsentPayload>(CardLinkEvents.CONSENT_EVENT, (data) => {
      if (typeof data !== 'string' && data.phoneNumber) {
        callback(data.phoneNumber);
      }
    });
  }

  addSessionCreatedListener(
    callback: (session: IaCardLinkSession) => void
  ): IaCardLinkEventSubscription {
    return this.subscribe<IaCardLinkSession>(
      CardLinkEvents.SESSION_CREATED,
      callback
    );
  }

  addPrescriptionsRedeemedListener(
    callback: (prescriptions: string) => void
  ): IaCardLinkEventSubscription {
    return this.subscribe<string>(
      CardLinkEvents.PRESCRIPTIONS_REDEEMED,
      callback
    );
  }

  addEventListener(
    callback: (event: IaCardLinkEvent) => void
  ): IaCardLinkEventSubscription {
    return this.subscribe<EventPayload>(CardLinkEvents.EVENT, (data) =>
      callback(eventName(data) as IaCardLinkEvent)
    );
  }

  addSavedCardsListener(
    callback: (cards: IaCardLinkSavedCard[]) => void
  ): IaCardLinkEventSubscription {
    return this.subscribe<EventPayload>(CardLinkEvents.EVENT, (data) => {
      if (typeof data === 'string' || data.event !== IaCardLinkEvent.CardSaved) {
        return;
      }
      callback(
        (data.cards ?? [])
          // A card without a name can't be represented.
          .filter((card) => typeof card?.name === 'string')
          .map(toSavedCard)
      );
    });
  }

  addInitializationErrorListener(
    callback: (message: string) => void
  ): IaCardLinkEventSubscription {
    return this.subscribe<EventPayload>(CardLinkEvents.EVENT, (data) => {
      if (
        typeof data !== 'string' &&
        data.event === IaCardLinkEvent.FailedToInitialize &&
        data.errorMessage
      ) {
        callback(data.errorMessage);
      }
    });
  }

  addResultListener(
    callback: (result: string | null) => void
  ): IaCardLinkEventSubscription {
    return this.subscribe<EventPayload>(CardLinkEvents.EVENT, (data) => {
      if (typeof data !== 'string' && data.event === IaCardLinkEvent.Finished) {
        callback(data.result ?? null);
      }
    });
  }

  addAnalyticsEventListener(
    callback: (eventName: string) => void
  ): IaCardLinkEventSubscription {
    return this.subscribe<string>(CardLinkEvents.ANALYTICS_EVENT, callback);
  }
}

export default IaModuleCardLink;

// Re-export types for convenience
export type {
  IaCardLinkLaunchOptions,
  IaCardLinkMocks,
  IaCardLinkSavedCard,
  IaCardLinkSession,
  IaCardLinkEventSubscription,
  IaCardLinkUpdateCardParams,
} from '@ihreapotheken/ia-sdk-interface';

export {
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
