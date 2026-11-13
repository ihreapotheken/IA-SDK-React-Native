/**
 * Event names for native communication.
 * Must match the constants in Android (IaSdkCardLinkModule.kt) and iOS (IaSdkCardLinkImpl.swift).
 */
export const CardLinkEvents = {
  /** Consent accepted/declined: `{ status, phoneNumber }` */
  CONSENT_EVENT: 'CARDLINK_CONSENT_EVENT',
  /** Session created with ID and expiration */
  SESSION_CREATED: 'CARDLINK_SESSION_CREATED',
  /** Prescription data redeemed from card */
  PRESCRIPTIONS_REDEEMED: 'CARDLINK_PRESCRIPTIONS_REDEEMED',
  /**
   * Lifecycle events: `{ event, cards?, errorMessage?, result? }`, with
   * `cards` for `cardSaved`, `errorMessage` for `failedToInitialize` and
   * `result` for `cardLinkResult`.
   */
  EVENT: 'CARDLINK_EVENT',
  /** Analytics tracking events */
  ANALYTICS_EVENT: 'CARDLINK_ANALYTICS_EVENT',
} as const;

export type CardLinkEventName = (typeof CardLinkEvents)[keyof typeof CardLinkEvents];
