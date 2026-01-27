package de.ihreapotheken.reactnative.otc

import android.app.Activity
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.sdk.integrations.api.view.IaSdkActivity
import de.ihreapotheken.sdk.integrations.api.view.IaScreen
import de.ihreapotheken.sdk.otc.OtcModule
import de.ihreapotheken.reactnative.core.IaSdkCoreModule

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

  override fun launchProductSearchRouteAndroid() {
    val context: Context = reactApplicationContext.currentActivity ?: reactApplicationContext.applicationContext
    val intent = Intent(context, IaSdkActivity::class.java)
    if (context !is Activity) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    intent.putExtra("viewId", IaScreen.SearchScreen::class.simpleName!!)
    context.startActivity(intent)
  }
}
