package de.ihreapotheken.reactnative.prescription

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = IaSdkPrescriptionModule.NAME)
class IaSdkPrescriptionModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkPrescriptionSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkPrescription"
  }

  override fun getName(): String = NAME

  override fun registerModule() {
    // Prescription module registration
    // Note: Android SDK may handle prescriptions differently
  }
}
