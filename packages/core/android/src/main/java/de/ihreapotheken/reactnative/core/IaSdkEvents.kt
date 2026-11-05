package de.ihreapotheken.reactnative.core

/**
 * Event names the core module emits. Must match `src/events.ts`.
 */
object IaSdkEvents {
  const val REQUEST = "IaSdkRequest"
  const val INITIALIZATION_STATE_CHANGED = "IaSdkInitializationStateChanged"
  const val APOFINDER_PHARMACY_CHANGED = "IaSdkApofinderPharmacyChanged"
  const val ANALYTICS_EVENT = "IaSdkAnalyticsEvent"
  const val CART_UPDATED = "IaSdkCartUpdated"
  const val ORDER_FINISHED = "IaSdkOrderFinished"
}

/**
 * Request types of [IaSdkEvents.REQUEST]. Must match `src/events.ts`.
 */
object IaSdkRequestTypes {
  const val NAVIGATION = "navigation"
  const val BACK_ACTION = "backAction"
  const val PRESCRIPTION_PHOTO_SCANNED = "prescriptionPhotoScanned"
  const val E_PRESCRIPTION_SCANNED = "ePrescriptionScanned"
}
