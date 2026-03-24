package de.ihreapotheken.reactnative.cardlink

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import android.util.Log
import de.ihreapotheken.sdk.cardlink.CardLinkListener
import de.ihreapotheken.sdk.cardlink.CardLinkSdkEnvironmentType
import de.ihreapotheken.sdk.cardlink.CardlinkModule
import de.ihreapotheken.sdk.cardlink.ConsentStatus
import de.ihreapotheken.sdk.cardlink.api.CardLink
import de.ihreapotheken.sdk.cardlink.api.CardLinkConfig
import de.ihreapotheken.sdk.cardlink.domain.model.CardLinkSession
import de.ihreapotheken.sdk.cardlink.domain.model.insurancecard.InsuranceCard
import de.ihreapotheken.sdk.integrations.api.IaSdk
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@ReactModule(name = IaSdkCardLinkModule.NAME)
class IaSdkCardLinkModule(
    reactContext: ReactApplicationContext,
) : NativeIaSdkCardLinkSpec(reactContext) {
    companion object {
        const val NAME = "IaSdkCardLink"
        private const val GUEST_USER_ID = "guest_user_id"

        // Event names matching TypeScript constants
        private const val EVENT_CONSENT = "CARDLINK_CONSENT_EVENT"
        private const val EVENT_SESSION_CREATED = "CARDLINK_SESSION_CREATED"
        private const val EVENT_PRESCRIPTIONS_REDEEMED = "CARDLINK_PRESCRIPTIONS_REDEEMED"
        private const val EVENT_CARDLINK = "CARDLINK_EVENT"
        private const val EVENT_ANALYTICS = "CARDLINK_ANALYTICS_EVENT"
        private const val EVENT_LAUNCH_RESULT = "CARDLINK_LAUNCH_RESULT"
        private const val EVENT_VERSION_RESULT = "CARDLINK_VERSION_RESULT"
        private const val EVENT_ENVIRONMENT_RESULT = "CARDLINK_ENVIRONMENT_RESULT"
        private const val EVENT_LOG_PATH_RESULT = "CARDLINK_LOG_PATH_RESULT"
        private const val EVENT_SAVED_CARDS_RESULT = "CARDLINK_SAVED_CARDS_RESULT"
        private const val EVENT_DELETE_CARD_RESULT = "CARDLINK_DELETE_CARD_RESULT"
    }

    // Hold strong references to prevent GC while CardLink activity is open
    private var activeListener: CardLinkListener? = null
    private var activeConfig: CardLinkConfig? = null

    override fun getName(): String = NAME

    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext.emitDeviceEvent(eventName, params)
    }

    override fun registerModule() {
        IaSdk.register(CardlinkModule)
    }

    override fun launchAndroid(
        sdkApiKey: String?,
        flowType: String?,
        pharmacyId: String?,
        consentStatus: String?,
        phoneNumber: String?,
        userId: String?,
        canCode: String?,
        cardName: String?,
        primaryColor: Double?,
        buttonsColor: Double?,
        textLinkColor: Double?,
        bottomNavigationColor: Double?,
        environment: String?,
        saveCardEnabled: Boolean?
    ) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            sendEvent(EVENT_LAUNCH_RESULT, "No activity available")
            return
        }

        if (sdkApiKey.isNullOrEmpty()) {
            sendEvent(EVENT_LAUNCH_RESULT, "SDK API key is required")
            return
        }

        if (pharmacyId.isNullOrEmpty()) {
            sendEvent(EVENT_LAUNCH_RESULT, "Pharmacy ID is required")
            return
        }

        if (phoneNumber.isNullOrEmpty()) {
            sendEvent(EVENT_LAUNCH_RESULT, "Phone number is required")
            return
        }

        Log.d("CardLinkModule", "launchAndroid: phoneNumber='$phoneNumber', consentStatus='$consentStatus', userId='$userId'")

        activeListener = object : CardLinkListener {
            override fun onConsentAccepted(setPhoneNumber: (String) -> Unit) {
                Log.d("CardLinkModule", "onConsentAccepted: setting phoneNumber='$phoneNumber'")
                setPhoneNumber(phoneNumber)
                sendEvent(EVENT_CONSENT, "accepted")
            }

            override fun onConsentDeclined() {
                sendEvent(EVENT_CONSENT, "declined")
            }

            override fun onSessionCreated(session: CardLinkSession) {
                val sessionMap = Arguments.createMap().apply {
                    putString("cardSessionId", session.cardSessionId)
                    putDouble("sessionExpireTimestamp", session.sessionExpireTimestamp.toDouble())
                }
                sendEvent(EVENT_SESSION_CREATED, sessionMap)
            }

            override fun onPrescriptionsRedeemed(prescriptions: String) {
                sendEvent(EVENT_PRESCRIPTIONS_REDEEMED, prescriptions)
            }

            override fun onGoToCart() {
                sendEvent(EVENT_CARDLINK, "goToCart")
            }

            override fun openTermsAndConditions() {
                sendEvent(EVENT_CARDLINK, "openTermsAndConditions")
            }

            override fun onSaveHealthCard(card: InsuranceCard) {
                sendEvent(EVENT_CARDLINK, "cardSaved")
            }

            override fun reportAnalytics(analyticEvent: String) {
                sendEvent(EVENT_ANALYTICS, analyticEvent)
            }

            override fun failedToInitializeCardlink() {
                sendEvent(EVENT_CARDLINK, "failedToInitialize")
            }
        }

        activeConfig = CardLinkConfig(
            sdkApiKey = sdkApiKey,
            pharmacyId = pharmacyId,
            userId = userId ?: GUEST_USER_ID,
            savedCardName = cardName,
            canCode = canCode,
            phoneNumber = phoneNumber,
            consentStatus = parseConsentStatus(consentStatus),
            saveCardEnabled = saveCardEnabled ?: false,
            primaryColor = primaryColor?.toInt(),
            buttonsColor = buttonsColor?.toInt(),
            textLinkColor = textLinkColor?.toInt(),
            bottomNavigationColor = bottomNavigationColor?.toInt(),
            cardLinkSdkEnvironment = parseEnvironment(environment),
            listener = activeListener!!
        )

        try {
            if (flowType == "launchCardLinkCards") {
                CardLink.startMyCards(activity, activeConfig!!)
            } else {
                CardLink.startCardLink(activity, activeConfig!!)
            }
            sendEvent(EVENT_LAUNCH_RESULT, "success")
        } catch (e: Exception) {
            sendEvent(EVENT_LAUNCH_RESULT, e.message ?: "Unknown error")
        }
    }

    override fun getVersionAndroid() {
        // CardLink SDK doesn't expose version on Android
        sendEvent(EVENT_VERSION_RESULT, null)
    }

    override fun getEnvironmentAndroid() {
        // CardLink SDK doesn't expose environment getter on Android
        sendEvent(EVENT_ENVIRONMENT_RESULT, null)
    }

    override fun getLogFilePathAndroid() {
        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
            val path = CardLink.getLogFilePath(activity)
            sendEvent(EVENT_LOG_PATH_RESULT, path)
        } else {
            sendEvent(EVENT_LOG_PATH_RESULT, null)
        }
    }

    override fun getSavedCardsAndroid(userId: String?) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            sendEvent(EVENT_SAVED_CARDS_RESULT, null)
            return
        }

        try {
            val cards = CardLink.getSavedCards(activity, userId ?: "")
            val json = Json.encodeToString(cards)
            sendEvent(EVENT_SAVED_CARDS_RESULT, json)
        } catch (e: Exception) {
            sendEvent(EVENT_SAVED_CARDS_RESULT, null)
        }
    }

    override fun deleteCardAndroid(userId: String?, cardName: String?) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            sendEvent(EVENT_DELETE_CARD_RESULT, "No activity available")
            return
        }

        if (userId.isNullOrEmpty()) {
            sendEvent(EVENT_DELETE_CARD_RESULT, "User ID is required")
            return
        }

        if (cardName.isNullOrEmpty()) {
            sendEvent(EVENT_DELETE_CARD_RESULT, "Card name is required")
            return
        }

        try {
            CardLink.deleteCard(activity, cardName, userId)
            sendEvent(EVENT_DELETE_CARD_RESULT, "success")
        } catch (e: Exception) {
            sendEvent(EVENT_DELETE_CARD_RESULT, e.message ?: "Unknown error")
        }
    }

    override fun addListener(eventType: String?) {
        // Required by RN event emitter spec; listener management is on JS side
    }

    override fun removeListeners(count: Double) {
        // Listener management is handled on the JavaScript side
    }

    private fun parseConsentStatus(value: String?): ConsentStatus {
        return when (value) {
            "CONSENT_ACCEPTED" -> ConsentStatus.CONSENT_ACCEPTED
            "CONSENT_DECLINED" -> ConsentStatus.CONSENT_DECLINED
            else -> ConsentStatus.SHOW_CONSENT
        }
    }

    private fun parseEnvironment(value: String?): CardLinkSdkEnvironmentType {
        return when (value) {
            "DEBUG" -> CardLinkSdkEnvironmentType.DEBUG
            else -> CardLinkSdkEnvironmentType.PRODUCTION
        }
    }
}
