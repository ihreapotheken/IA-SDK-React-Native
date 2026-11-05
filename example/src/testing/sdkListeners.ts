import {
  iaSdk,
  IaBaseModule,
  type IaCardLinkModule,
  type IaOrderingModule,
  type IaPrescriptionModule,
} from '@ihreapotheken/ia-sdk-core';
import { analyticsLog, describe, eventLog } from './eventLog';

/**
 * Adds every SDK listener to the event log. Called once after registration;
 * the listeners live as long as the app.
 */
export function attachSdkListeners() {
  iaSdk.addInitializationStateListener((state) =>
    eventLog.add('Initialization state', state)
  );
  iaSdk.addApofinderPharmacyChangedListener((change) =>
    eventLog.add(
      'Apofinder',
      `pharmacy ${change.pharmacyId}${change.isFromPrerequisites ? ' (prerequisites)' : ''}`
    )
  );
  iaSdk.addAnalyticsEventListener((event) =>
    analyticsLog.add('SDK', `${event.name} ${describe(event.parameters)}`)
  );

  if (iaSdk.hasModule(IaBaseModule.Ordering)) {
    const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
    ordering.addCartUpdatedListener((state) =>
      eventLog.add('Cart updated', describe(state))
    );
    ordering.addOrderFinishedListener((signatures) =>
      eventLog.add('Order finished', describe(signatures))
    );
  }

  if (iaSdk.hasModule(IaBaseModule.Prescription)) {
    const prescription = iaSdk.getModule<IaPrescriptionModule>(
      IaBaseModule.Prescription
    );
    prescription.addScannerCameraErrorListener((message) =>
      eventLog.add('Scanner camera error', message)
    );
  }

  if (iaSdk.hasModule(IaBaseModule.CardLink)) {
    const cardLink = iaSdk.getModule<IaCardLinkModule>(IaBaseModule.CardLink);
    cardLink.addConsentEventListener((event) =>
      eventLog.add('CardLink consent', event)
    );
    cardLink.addConsentPhoneNumberListener((phoneNumber) =>
      eventLog.add('CardLink consent phone', phoneNumber)
    );
    cardLink.addSessionCreatedListener((session) =>
      eventLog.add('CardLink session', describe(session))
    );
    cardLink.addPrescriptionsRedeemedListener((prescriptions) =>
      eventLog.add('CardLink prescriptions', prescriptions.slice(0, 200))
    );
    cardLink.addEventListener((event) => eventLog.add('CardLink event', event));
    cardLink.addSavedCardsListener((cards) =>
      eventLog.add('CardLink saved cards', describe(cards))
    );
    cardLink.addInitializationErrorListener((message) =>
      eventLog.add('CardLink init error', message)
    );
    cardLink.addResultListener((result) =>
      eventLog.add('CardLink result', String(result))
    );
    cardLink.addAnalyticsEventListener((eventName) =>
      analyticsLog.add('CardLink', eventName)
    );
  }
}
