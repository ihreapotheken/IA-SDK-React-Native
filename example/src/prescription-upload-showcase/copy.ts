/** All text of the showcase, in one place to adapt it to the audience. */
export const copy = {
  brand: 'ia.de',
  brandProduct: 'AppSDK',

  heroEyebrow: 'Prescriptions in your app',
  heroTitle: 'From prescription to local pharmacy in a few taps',
  heroBody:
    'Your app hands the prescriptions it already has to a pharmacy nearby, and the patient checks out right inside your app.',
  transferAction: 'Transfer prescriptions',
  transferCaption:
    'Sends three sample prescriptions (photo, PDF and e-prescription) and the patient’s details.',

  connecting: 'Connecting to ia.de…',
  connectingSlow: 'This is taking longer than usual.',
  connectFailed: 'Couldn’t connect to ia.de',
  connectFailedBody: 'Check the connection and try again.',
  vpnHint: 'The QA backend is only reachable over VPN.',
  retry: 'Try again',

  moreSection: 'More from the SDK',
  scanTitle: 'Scan a prescription',
  scanBody: 'The e-prescription code, or a photo of a paper prescription',
  dashboardTitle: 'Pharmacy services',
  dashboardBody: 'Redeem prescriptions, book appointments and follow orders',

  pharmacySection: 'Your pharmacy',
  pharmacyNone: 'No pharmacy chosen yet',
  pharmacyNoneBody: 'Choose one nearby to redeem prescriptions with.',
  pharmacySelected: 'Pharmacy selected',
  pharmacyId: (id: string) => `Pharmacy no. ${id}`,
  pharmacyOpen: 'Open now',
  pharmacyClosed: 'Closed now',
  pharmacyDetails: 'Details',
  pharmacyChange: 'Change',
  pharmacyChoose: 'Choose a pharmacy',

  cartTitle: 'Cart',
  cartItems: (count: number) => (count === 1 ? '1 item' : `${count} items`),

  orderPlaced: 'Order placed',
  orderPlacedBody:
    'The pharmacy received the order. The SDK reported it back to your app with these codes.',
  orderCodeIa: 'ia.de order code',
  orderIdHost: 'Your app’s order ID',
  done: 'Done',

  controlsSection: 'Demo controls',
  controlsHint: 'For the presenter: prepare or reset the demo.',
  controlsPharmacy: 'Demo pharmacy',
  controlsClearCart: 'Empty cart',
  controlsClearPharmacy: 'Forget pharmacy',
  controlsReset: 'Reset demo',
  controlsResetBody:
    'Signs out and clears the pharmacy, cart and accepted terms.',

  toastPharmacySet: (id: string) => `Pharmacy ${id} selected`,
  toastCartCleared: 'Cart emptied',
  toastPharmacyCleared: 'Pharmacy forgotten',
  toastReset: 'Demo reset',
  failed: (action: string) => `${action} didn’t work`,
} as const;
