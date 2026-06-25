package de.ihreapotheken.reactnative.prescription

import android.app.Activity
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import de.ihreapotheken.sdk.integrations.api.view.IaSdkActivity
import de.ihreapotheken.sdk.integrations.api.view.IaScreen

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

  override fun launchRedeemPrescriptionScreenAndroid() {
    val context: Context = reactApplicationContext.currentActivity ?: reactApplicationContext.applicationContext
    val intent = Intent(
      context,
      IaSdkActivity::class.java,
    )
    if (context !is Activity) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    intent.putExtra("viewId", IaScreen.RedeemPrescription::class.simpleName!!)
    context.startActivity(intent)
  }
}
