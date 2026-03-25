package de.ihreapotheken.reactnative.pharmacy

import android.app.Activity
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.sdk.apofinder.ApofinderModule
import de.ihreapotheken.sdk.integrations.api.IaSdk
import de.ihreapotheken.sdk.integrations.api.view.IaSdkActivity
import de.ihreapotheken.sdk.integrations.api.view.IaScreen
import de.ihreapotheken.sdk.pharmacy.PharmacyModule
import de.ihreapotheken.reactnative.core.IaSdkCoreModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@ReactModule(name = IaSdkPharmacyModule.NAME)
class IaSdkPharmacyModule(
  reactContext: ReactApplicationContext,
) : NativeIaSdkPharmacySpec(reactContext) {
  companion object {
    const val NAME = "IaSdkPharmacy"
  }

  override fun getName(): String = NAME

  override fun registerModule() {
    IaSdkCoreModule.registerModuleType(PharmacyModule)
    IaSdkCoreModule.registerModuleType(ApofinderModule)
  }

  override fun launchPharmacyDetailsAndroid() {
    val context: Context = reactApplicationContext.currentActivity ?: reactApplicationContext.applicationContext
    val intent = Intent(context, IaSdkActivity::class.java)
    if (context !is Activity) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    intent.putExtra("viewId", IaScreen.PharmacyScreen::class.simpleName!!)
    context.startActivity(intent)
  }

  override fun setPharmacyIdAndroid(pharmacyId: String) {
    // Set pharmacy ID in the SDK
    // Implementation depends on the Android SDK API
  }

  override fun getPharmacyIdAndroid(completionHandler: Callback) {
    CoroutineScope(Dispatchers.Main).launch {
      try {
        val pharmacyId = IaSdk.pharmacy.getPharmacyId()
        completionHandler.invoke(pharmacyId)
      } catch (e: Exception) {
        completionHandler.invoke(null)
      }
    }
  }
}
