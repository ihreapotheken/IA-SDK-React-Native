package de.ihreapotheken.reactnative.cardlink

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class IaSdkCardLinkPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == IaSdkCardLinkModule.NAME) IaSdkCardLinkModule(reactContext) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        IaSdkCardLinkModule.NAME to ReactModuleInfo(
          IaSdkCardLinkModule.NAME, IaSdkCardLinkModule.NAME,
          false, false, false, true
        )
      )
    }
  }
}
