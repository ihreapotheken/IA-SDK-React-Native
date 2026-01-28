package de.ihreapotheken.reactnative.prescription

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class IaSdkPrescriptionPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == IaSdkPrescriptionModule.NAME) IaSdkPrescriptionModule(reactContext) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        IaSdkPrescriptionModule.NAME to ReactModuleInfo(
          IaSdkPrescriptionModule.NAME, IaSdkPrescriptionModule.NAME,
          false, false, false, true
        )
      )
    }
  }
}
