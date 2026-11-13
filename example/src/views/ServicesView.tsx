import { useState } from 'react';
import { Platform, ScrollView, Text } from 'react-native';
import {
  iaSdk,
  IaBaseModule,
  IaTransferPrescriptionsFinishAction,
  PrescriptionInsuranceType,
  Salutation,
  type IaOrderingModule,
  type IaOverTheCounterModule,
  type IaPharmacyModule,
} from '@ihreapotheken/ia-sdk-core';
import {
  mockEPrescriptionCode,
  mockJpgPrescription,
  mockPdfPrescription,
  mockPngPrescription,
} from '../testData';
import { ActionButton, runAction, runLaunch, Section, styles } from './ui';

const TEST_PHARMACY_ID = '2163';

function ordering() {
  return iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
}

function pharmacy() {
  return iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);
}

const TRANSFER_VARIANTS: {
  label: string;
  finishAction: IaTransferPrescriptionsFinishAction;
  showActivityIndicator: boolean;
  platform?: 'ios';
}[] = [
  {
    label: 'Transfer Prescriptions, Open Cart',
    finishAction: IaTransferPrescriptionsFinishAction.OpenCart,
    showActivityIndicator: true,
  },
  {
    label: 'Transfer Prescriptions, Bottom Sheet',
    finishAction: IaTransferPrescriptionsFinishAction.ShowBottomSheet,
    showActivityIndicator: true,
  },
  {
    label: 'Transfer Prescriptions, No Action or Indicator',
    finishAction: IaTransferPrescriptionsFinishAction.NoAction,
    showActivityIndicator: false,
    platform: 'ios',
  },
];

/**
 * The SDK keeps these settings while the app runs, so they're kept here
 * rather than in the view, which the tab bar remounts. They start out as the
 * SDK defaults.
 */
const appearance = { isHapticFeedbackEnabled: true, showsMascot: true };

/** Takes the mascot setting of the initialization options. */
export function setInitialMascotVisibility(showsMascot: boolean) {
  appearance.showsMascot = showsMascot;
}

/**
 * Calls the SDK's non-screen APIs, grouped like the native demo apps.
 */
export function ServicesView({ isInitialized }: { isInitialized: boolean }) {
  const [isHapticFeedbackEnabled, setIsHapticFeedbackEnabled] = useState(
    appearance.isHapticFeedbackEnabled
  );
  const [showsMascot, setShowsMascot] = useState(appearance.showsMascot);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {!isInitialized && (
        <Text style={styles.hint}>
          Initialize the SDK on the Home tab first; most calls need it.
        </Text>
      )}

      <Section title="Prerequisites">
        <ActionButton
          title="Reset Prerequisites"
          description="Legal documents, onboarding and pharmacy are asked again"
          onPress={() => runAction('Reset Prerequisites', () => iaSdk.resetPrerequisites())}
        />
        <ActionButton
          title="Reset Legal Disclaimer"
          platform="ios"
          onPress={() => runAction('Reset Legal Disclaimer', () => iaSdk.resetLegalDisclaimer())}
        />
        <ActionButton
          title="Mark Onboarding Not Shown"
          platform="ios"
          onPress={() => runAction('Onboarding', () => iaSdk.setIsOnboardingShown(false))}
        />
        <ActionButton
          title="Reset Analytics Consent"
          description="The legal screen asks again"
          onPress={() => runAction('Reset Analytics Consent', () => iaSdk.resetAnalyticsConsent())}
        />
      </Section>

      <Section title="Pharmacy">
        <ActionButton
          title={`Set Pharmacy ${TEST_PHARMACY_ID}`}
          onPress={() => runAction('Set Pharmacy', () => pharmacy().setPharmacyId(TEST_PHARMACY_ID))}
        />
        <ActionButton
          title="Set Invalid Pharmacy ID"
          description="Rejects with ARG_ERROR"
          onPress={() => runAction('Set Pharmacy', () => pharmacy().setPharmacyId('abc'))}
        />
        <ActionButton
          title={`Save Pharmacy ${TEST_PHARMACY_ID} Without Validation`}
          platform="ios"
          onPress={() => runAction('Save Pharmacy', () => pharmacy().savePharmacyId(TEST_PHARMACY_ID))}
        />
        <ActionButton
          title="Get Pharmacy ID"
          onPress={() => runAction('Pharmacy ID', () => pharmacy().getPharmacyId(), (id) => id ?? 'null')}
        />
        <ActionButton
          title="Get Pharmacy"
          platform="ios"
          onPress={() =>
            runAction('Pharmacy', () => pharmacy().getPharmacy(), (details) =>
              details
                ? `${details.additionalInformation.name}\n${details.location.street}, ${details.location.postcode} ${details.location.city}\nOpen now: ${details.businessHours.isOpenNow}`
                : 'No pharmacy selected'
            )
          }
        />
        <ActionButton
          title="Clear Pharmacy ID"
          description="Also empties the cart"
          onPress={() => runAction('Clear Pharmacy', () => pharmacy().clearPharmacyId())}
        />
      </Section>

      <Section title="Ordering">
        {TRANSFER_VARIANTS.map((variant) => (
          <ActionButton
            key={variant.label}
            title={variant.label}
            platform={variant.platform}
            onPress={() =>
              runAction('Transfer Prescriptions', () =>
                ordering().transferPrescriptions({
                  images: [mockPngPrescription, mockJpgPrescription],
                  pdfs: [
                    {
                      data: mockPdfPrescription,
                      insuranceType: PrescriptionInsuranceType.PublicHealthcare,
                    },
                  ],
                  codes: [mockEPrescriptionCode],
                  orderId: 'test-order-123',
                  finishAction: variant.finishAction,
                  showActivityIndicator: variant.showActivityIndicator,
                })
              )
            }
          />
        ))}
        <ActionButton
          title="Get Cart Details"
          platform="ios"
          onPress={() =>
            runAction('Cart Details', () => ordering().getCartDetails(), (details) => details ?? 'No cart')
          }
        />
        <ActionButton
          title="Get Cart State"
          platform="ios"
          onPress={() =>
            runAction('Cart State', () => ordering().getCartState(), (state) =>
              state ? JSON.stringify(state, null, 2) : 'No cart'
            )
          }
        />
        <ActionButton
          title="Reload Cart and Emit Update"
          description="The update shows in the Events tab"
          platform="ios"
          onPress={() =>
            runAction('Cart State', () =>
              ordering().getCartState({ allowCached: false, shouldEmitCartUpdate: true })
            )
          }
        />
        <ActionButton
          title="Clear Cart"
          onPress={() => runAction('Clear Cart', () => ordering().clearCart())}
        />
        <ActionButton
          title="Delete Order History"
          platform="ios"
          onPress={() => runAction('Delete Order History', () => ordering().deleteOrderHistory())}
        />
      </Section>

      <Section title="User">
        <ActionButton
          title="Set Guest User Data"
          description="Phone number with a leading zero"
          onPress={() =>
            runAction('Guest User Data', () =>
              iaSdk.setGuestUserData({
                salutation: Salutation.NotDisclosed,
                firstName: 'First',
                lastName: 'Last',
                email: 'email@example.com',
                phoneNumberCountryCode: 49,
                phoneNumberWithoutCountryCode: '015112345678',
              })
            )
          }
        />
        <ActionButton
          title="Set Billing Address"
          onPress={() =>
            runAction('Billing Address', () =>
              iaSdk.setUserBillingAddress({
                salutation: Salutation.Male,
                firstName: 'First',
                lastName: 'Last',
                additionalInfo: 'c/o Example',
                street: 'Musterstraße',
                houseNumber: '1',
                zipCode: '10115',
                city: 'Berlin',
                phoneNumberCountryCode: 49,
                phoneNumberWithoutCountryCode: '24332442',
              })
            )
          }
        />
        <ActionButton
          title="Set Delivery Address"
          onPress={() =>
            runAction('Delivery Address', () =>
              iaSdk.setUserDeliveryAddress({
                salutation: Salutation.Female,
                firstName: 'First',
                lastName: 'Last',
                street: 'Musterstraße',
                houseNumber: '2',
                zipCode: '10115',
                city: 'Berlin',
              })
            )
          }
        />
        <ActionButton
          title="Clear Billing and Delivery Addresses"
          onPress={() =>
            runAction('Clear Addresses', async () => {
              await iaSdk.clearUserBillingAddress();
              await iaSdk.clearUserDeliveryAddress();
            })
          }
        />
        <ActionButton
          title="Delete User"
          platform="ios"
          onPress={() => runAction('Delete User', () => iaSdk.deleteUser())}
        />
        <ActionButton
          title="Logout"
          description="Resets user data, prerequisites, pharmacy and cart"
          onPress={() => runAction('Logout', () => iaSdk.logout())}
        />
        <ActionButton
          title="Transfer SDK v1 User Data"
          onPress={() => runAction('Transfer SDK v1 User Data', () => iaSdk.transferSDKv1UserData())}
        />
      </Section>

      <Section title="Appearance">
        <ActionButton
          title={`${isHapticFeedbackEnabled ? 'Disable' : 'Enable'} Haptic Feedback`}
          platform="android"
          onPress={() =>
            runAction('Haptic Feedback', async () => {
              await iaSdk.setHapticFeedbackEnabled(!isHapticFeedbackEnabled);
              appearance.isHapticFeedbackEnabled = !isHapticFeedbackEnabled;
              setIsHapticFeedbackEnabled(!isHapticFeedbackEnabled);
            })
          }
        />
        <ActionButton
          title={`${showsMascot ? 'Hide' : 'Show'} Mascot Illustrations`}
          description="Applies to screens rendered afterwards, e.g. CardLink FAQ"
          platform="ios"
          onPress={() =>
            runAction('Mascot Illustrations', async () => {
              await iaSdk.setShouldShowMascotIllustrations(!showsMascot);
              appearance.showsMascot = !showsMascot;
              setShowsMascot(!showsMascot);
            })
          }
        />
        {Platform.OS === 'android' && (
          <Text style={styles.hint}>
            On Android the mascot is set with the Home tab's initialization options.
          </Text>
        )}
      </Section>

      <Section title="Debugging">
        <ActionButton
          title="Present Logs"
          onPress={() => runLaunch('Present Logs', () => iaSdk.presentLogs())}
        />
        <ActionButton
          title="Export Logs"
          platform="android"
          onPress={() => runAction('Export Logs', () => iaSdk.exportLogs(), (path) => path ?? 'null')}
        />
        <ActionButton
          title="Get User ID"
          platform="ios"
          onPress={() => runAction('User ID', () => iaSdk.getUserId(), (id) => id ?? 'null')}
        />
      </Section>

      {Platform.OS === 'ios' && (
        <Section title="Cache">
          <ActionButton
            title="Clean Cache"
            description="Initialization and prerequisites; initialize again afterwards"
            onPress={() => runAction('Clean Cache', () => iaSdk.cleanCache(true, true))}
          />
          <ActionButton
            title="Remove All Cached Responses"
            onPress={() => runAction('Cached Responses', () => iaSdk.removeAllCachedResponses())}
          />
          <ActionButton
            title="Clear Product Grid Cache"
            onPress={() =>
              runAction('Product Grid Cache', () =>
                iaSdk
                  .getModule<IaOverTheCounterModule>(IaBaseModule.OverTheCounter)
                  .clearProductGridCache()
              )
            }
          />
        </Section>
      )}
    </ScrollView>
  );
}
