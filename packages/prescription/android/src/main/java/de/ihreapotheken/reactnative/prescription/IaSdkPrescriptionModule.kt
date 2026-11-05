package de.ihreapotheken.reactnative.prescription

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.reactnative.core.IaSdkCoreModule
import de.ihreapotheken.sdk.rx.RxModule

@ReactModule(name = IaSdkPrescriptionModule.NAME)
class IaSdkPrescriptionModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkPrescriptionSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkPrescription"
  }

  override fun getName(): String = NAME

  override fun registerModule() {
    // The prescription module of the SDK, which reports scanned
    // prescriptions through the core module's listener.
    IaSdkCoreModule.registerModuleType(RxModule)
  }
}
