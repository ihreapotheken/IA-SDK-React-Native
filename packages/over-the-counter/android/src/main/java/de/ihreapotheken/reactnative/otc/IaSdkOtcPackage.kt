package de.ihreapotheken.reactnative.otc

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class IaSdkOtcPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == IaSdkOtcModule.NAME) IaSdkOtcModule(reactContext) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        IaSdkOtcModule.NAME to ReactModuleInfo(
          IaSdkOtcModule.NAME, IaSdkOtcModule.NAME,
          false, false, false, true
        )
      )
    }
  }
}
