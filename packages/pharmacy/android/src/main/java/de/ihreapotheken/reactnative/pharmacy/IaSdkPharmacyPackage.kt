package de.ihreapotheken.reactnative.pharmacy

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class IaSdkPharmacyPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == IaSdkPharmacyModule.NAME) IaSdkPharmacyModule(reactContext) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        IaSdkPharmacyModule.NAME to ReactModuleInfo(
          IaSdkPharmacyModule.NAME, IaSdkPharmacyModule.NAME,
          false, false, false, true
        )
      )
    }
  }
}
