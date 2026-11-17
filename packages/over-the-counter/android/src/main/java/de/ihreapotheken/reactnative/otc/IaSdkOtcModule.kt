package de.ihreapotheken.reactnative.otc

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.reactnative.core.IaSdkCoreModule
import de.ihreapotheken.sdk.otc.OtcModule

@ReactModule(name = IaSdkOtcModule.NAME)
class IaSdkOtcModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkOtcSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkOtc"
  }

  override fun getName(): String = NAME

  override fun registerModule() {
    IaSdkCoreModule.registerModuleType(OtcModule)
  }
}
