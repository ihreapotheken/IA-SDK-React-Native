/**
 * Event names for native communication.
 * Must match the constants in Android (IaSdkCardLinkModule.kt) and iOS (IaSdkCardLinkImpl.swift).
 */
export const CardLinkEvents = {
  /** Consent accepted/declined event */
  CONSENT_EVENT: 'CARDLINK_CONSENT_EVENT',
  /** Session created with ID and expiration */
  SESSION_CREATED: 'CARDLINK_SESSION_CREATED',
  /** Prescription data redeemed from card */
  PRESCRIPTIONS_REDEEMED: 'CARDLINK_PRESCRIPTIONS_REDEEMED',
  /** General CardLink lifecycle events */
  EVENT: 'CARDLINK_EVENT',
  /** Analytics tracking events */
  ANALYTICS_EVENT: 'CARDLINK_ANALYTICS_EVENT',
  // Android-only result events (for async method completion)
  /** Launch operation result (Android) */
  LAUNCH_RESULT: 'CARDLINK_LAUNCH_RESULT',
  /** Version query result (Android) */
  VERSION_RESULT: 'CARDLINK_VERSION_RESULT',
  /** Environment query result (Android) */
  ENVIRONMENT_RESULT: 'CARDLINK_ENVIRONMENT_RESULT',
  /** Log file path query result (Android) */
  LOG_PATH_RESULT: 'CARDLINK_LOG_PATH_RESULT',
  /** Saved cards query result (Android) */
  SAVED_CARDS_RESULT: 'CARDLINK_SAVED_CARDS_RESULT',
  /** Delete card operation result (Android) */
  DELETE_CARD_RESULT: 'CARDLINK_DELETE_CARD_RESULT',
} as const;

export type CardLinkEventName = (typeof CardLinkEvents)[keyof typeof CardLinkEvents];
