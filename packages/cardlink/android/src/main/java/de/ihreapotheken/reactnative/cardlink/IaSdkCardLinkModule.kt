package de.ihreapotheken.reactnative.cardlink

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = IaSdkCardLinkModule.NAME)
class IaSdkCardLinkModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkCardLinkSpec(reactContext) {
  companion object {
    const val NAME = "IaSdkCardLink"
  }

  override fun getName(): String = NAME

  override fun registerModule() {
    // CardLink module registration
    // Note: Android SDK may handle CardLink differently
  }
}
