/**
 * Event names the core native module emits. Must match the constants in
 * Android (`IaSdkEvents.kt`) and iOS (`IaSdkEvents.swift`).
 *
 * The native SDKs report ordering and prescription callbacks through the
 * core SDK delegate/listeners, so those events come from the core module too.
 */
export const IaSdkEvents = {
  /** Native asks JS for a decision: `{ requestId, type, payload }`. */
  REQUEST: 'IaSdkRequest',
  /** `{ state }`, one of `IaSdkInitializationState`. */
  INITIALIZATION_STATE_CHANGED: 'IaSdkInitializationStateChanged',
  /** `{ pharmacyId, isFromPrerequisites }`. */
  APOFINDER_PHARMACY_CHANGED: 'IaSdkApofinderPharmacyChanged',
  /** `{ name, parameters }`. */
  ANALYTICS_EVENT: 'IaSdkAnalyticsEvent',
  /** `{ message, level }` (iOS). */
  LOG_MESSAGE: 'IaSdkLogMessage',
  /** `CartState`. */
  CART_UPDATED: 'IaSdkCartUpdated',
  /** `TransactionSignatures`. */
  ORDER_FINISHED: 'IaSdkOrderFinished',
  /** `{ message }` (iOS). */
  SCANNER_CAMERA_ERROR: 'IaSdkScannerCameraError',
} as const;

/**
 * Request types of `IaSdkEvents.REQUEST` and the response each expects.
 */
export const IaSdkRequestTypes = {
  /** Payload `{ navigationTarget }`, response `{ handled: boolean }`. */
  NAVIGATION: 'navigation',
  /** Payload `{}`, response `{ shouldClose: boolean }` (Android). */
  BACK_ACTION: 'backAction',
  /** Payload `{ imageData }` (base64), response `IaPrescriptionScanDecision`. */
  PRESCRIPTION_PHOTO_SCANNED: 'prescriptionPhotoScanned',
  /** Payload `{ rawCode, urls }`, response `IaPrescriptionScanDecision`. */
  E_PRESCRIPTION_SCANNED: 'ePrescriptionScanned',
} as const;

/**
 * Screens `launchScreen` presents.
 */
export const IaSdkScreens = {
  START: 'start',
  APOFINDER: 'apofinder',
  CART: 'cart',
  SEARCH: 'search',
  PHARMACY: 'pharmacy',
  REDEEM_PRESCRIPTION: 'redeemPrescription',
  /** iOS only. */
  PRESCRIPTION_SCANNER: 'prescriptionScanner',
  /** iOS only. */
  E_PRESCRIPTION_SCANNER: 'ePrescriptionScanner',
} as const;
