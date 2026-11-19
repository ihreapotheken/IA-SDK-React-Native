import { Platform } from 'react-native';
import { APPSDK_ACCESS_KEY } from '@env';
import {
  iaSdk,
  IaBaseModule,
  IaTransferPrescriptionsFinishAction,
  PrescriptionInsuranceType,
  Salutation,
  ServerEnvironment,
  type IaOrderingModule,
  type IaPharmacy,
  type IaPharmacyModule,
  type IaPrescriptionModule,
  type TransactionSignatures,
} from '@ihreapotheken/ia-sdk-core';
import { IaModuleOrdering } from '@ihreapotheken/ia-sdk-ordering';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';
import { IaModulePrescription } from '@ihreapotheken/ia-sdk-prescription';
import { CLIENT_ID, serverEnvironment } from '../../sdkConfig';
import { mockEPrescriptionCode } from '../../testEPrescription';
import {
  samplePrescriptionPdf,
  samplePrescriptionPhoto,
} from './samplePrescriptions';

/** The test pharmacies the presenter can switch between. */
export const DEMO_PHARMACY_IDS = ['2163', '10041'] as const;

export const ordering = () =>
  iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
export const pharmacy = () =>
  iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);
export const prescription = () =>
  iaSdk.getModule<IaPrescriptionModule>(IaBaseModule.Prescription);

/**
 * Registers the modules of the NativeScript plugin's demo: ordering, pharmacy
 * and prescription, without over-the-counter and CardLink. The SDK only offers
 * the features of the modules registered here; Apofinder and appointments come
 * with the core. The showcase build leaves out the other modules' native
 * libraries too (example/android/app/build.gradle).
 */
export function registerModules() {
  return iaSdk.register([
    new IaModuleOrdering(),
    new IaModulePharmacy(),
    new IaModulePrescription(),
  ]);
}

export function initialize() {
  if (!APPSDK_ACCESS_KEY) {
    return Promise.reject(
      new Error('APPSDK_ACCESS_KEY is missing. Add it to example/.secrets.')
    );
  }
  return iaSdk.initialize({
    accessKey: APPSDK_ACCESS_KEY,
    clientId: CLIENT_ID,
    serverEnvironment,
    // Outside production, Apofinder lists the test pharmacies too.
    qaConfiguration:
      serverEnvironment === ServerEnvironment.Production
        ? undefined
        : { showTestPharmaciesInApofinder: true },
  });
}

export interface PharmacyState {
  id: string | null;
  /** The pharmacy's details, only available on iOS. */
  details: IaPharmacy | null;
}

export const NO_PHARMACY: PharmacyState = { id: null, details: null };

export async function loadPharmacy(): Promise<PharmacyState> {
  const id = await pharmacy().getPharmacyId();
  const details =
    id && Platform.OS === 'ios'
      ? await pharmacy()
          .getPharmacy()
          .catch(() => null)
      : null;
  return { id, details };
}

/** The number of items in the cart, where the SDK reports it without a cart update (iOS). */
export async function loadCartCount(): Promise<number | null> {
  if (Platform.OS !== 'ios') return null;
  const state = await ordering().getCartState();
  return state?.totalAmountInCart ?? 0;
}

/** An order ID like a host app's own, which the SDK reports back with the placed order. */
function createHostOrderId() {
  return `APP-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/**
 * Like a host app that already holds the patient's prescriptions and details,
 * e.g. from a telemedicine consultation: hands both to the SDK, which opens
 * the cart with them.
 *
 * @returns The app's order ID passed with the prescriptions.
 */
export async function transferFromHostApp(): Promise<string> {
  const orderId = createHostOrderId();
  await iaSdk.setGuestUserData({
    salutation: Salutation.Male,
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max.mustermann@example.com',
    phoneNumberCountryCode: 49,
    phoneNumberWithoutCountryCode: '015112345678',
  });
  await ordering().transferPrescriptions({
    images: [samplePrescriptionPhoto],
    pdfs: [
      {
        data: samplePrescriptionPdf,
        insuranceType: PrescriptionInsuranceType.PublicHealthcare,
      },
    ],
    codes: [mockEPrescriptionCode],
    orderId,
    finishAction: IaTransferPrescriptionsFinishAction.OpenCart,
    showActivityIndicator: true,
  });
  return orderId;
}

/** An order the SDK reported as placed, with the codes both apps know it by. */
export interface PlacedOrder {
  /** The ia.de order codes, one per order placed in the checkout. */
  iaOrderCodes: string[];
  /** The order IDs the app passed with the prescriptions. */
  hostOrderIds: string[];
}

/**
 * The codes of a placed order, with the app's own order IDs where the SDK
 * doesn't report them.
 */
export function placedOrderFrom(
  signatures: TransactionSignatures,
  handedOverIds: string[]
): PlacedOrder {
  const iaOrderCodes = (
    signatures.orderCodes.length > 0
      ? signatures.orderCodes
      : [signatures.orderCode]
  ).filter(Boolean);
  const reportedIds = signatures.clientOrderIDs.filter(Boolean);
  return {
    iaOrderCodes,
    hostOrderIds: reportedIds.length > 0 ? reportedIds : handedOverIds,
  };
}

/** The message of an SDK error, with its code. */
export function describeError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const message = error instanceof Error ? error.message : String(error);
  return code ? `${message} (${code})` : message;
}
