import type {
  IaEPrescriptionScan,
  IaPrescriptionModule,
  IaPrescriptionScanDecision,
  IaScannerCameraState,
  IaSdkSubscription,
} from '@ihreapotheken/ia-sdk-interface';
import {
  IaBaseModule,
  IaPrescriptionScannerType,
} from '@ihreapotheken/ia-sdk-interface';
import { IaSdkInternal, warnUnsupported } from '@ihreapotheken/ia-sdk-core';
import IaSdkPrescriptionNative from './NativeIaSdkPrescription';

type PhotoScanHandler = (
  imageBase64: string
) => Promise<IaPrescriptionScanDecision>;
type EPrescriptionScanHandler = (
  scan: IaEPrescriptionScan
) => Promise<IaPrescriptionScanDecision>;

/**
 * Implementation of the Prescription module for the ia.de AppSDK.
 * Provides prescription scanning and management functionality.
 */
export class IaModulePrescription implements IaPrescriptionModule {
  readonly moduleType = IaBaseModule.Prescription;

  private photoScanHandler: PhotoScanHandler | null = null;
  private ePrescriptionScanHandler: EPrescriptionScanHandler | null = null;

  async register(): Promise<void> {
    IaSdkPrescriptionNative.registerModule();
  }

  /**
   * Launches the "redeem prescription" screen on top of the navigation stack.
   */
  async launchRedeemPrescriptionScreen(): Promise<void> {
    return IaSdkInternal.launchScreen(
      IaSdkInternal.screens.REDEEM_PRESCRIPTION
    );
  }

  /**
   * Launches the prescription scanner for the given type directly, without
   * the "redeem prescription" screen (iOS only). Each launch starts with the
   * camera on, the flashlight off and the preview running.
   */
  async launchPrescriptionScanner(
    type: IaPrescriptionScannerType
  ): Promise<void> {
    if (
      warnUnsupported('IaModulePrescription', 'launchPrescriptionScanner', 'ios')
    ) {
      return;
    }
    return IaSdkInternal.launchScreen(
      type === IaPrescriptionScannerType.EPrescription
        ? IaSdkInternal.screens.E_PRESCRIPTION_SCANNER
        : IaSdkInternal.screens.PRESCRIPTION_SCANNER
    );
  }

  /**
   * Controls the camera of the scanner opened with
   * `launchPrescriptionScanner` (iOS only). Unset values stay unchanged.
   */
  async setScannerCameraState(state: IaScannerCameraState): Promise<void> {
    if (
      warnUnsupported('IaModulePrescription', 'setScannerCameraState', 'ios')
    ) {
      return;
    }
    return IaSdkInternal.setPrescriptionScannerCameraState(state);
  }

  /**
   * Called when the user photographs a paper prescription in the SDK scanner,
   * or picks a photo of one, with the encoded image as base64.
   *
   * Return `{ decision: 'handled' }` to take over the prescription, or
   * `{ decision: 'error', message }` to reject it. When not set, or for
   * `performDefault`, the SDK continues with its built-in handling, as it does
   * when the handler throws or doesn't answer within 2 minutes. After
   * `handled` the scanner keeps scanning; close it, for example with
   * `iaSdk.finishAllActivities()`.
   */
  get onPrescriptionPhotoScanned(): PhotoScanHandler | null {
    return this.photoScanHandler;
  }

  set onPrescriptionPhotoScanned(handler: PhotoScanHandler | null) {
    this.photoScanHandler = handler;
    IaSdkInternal.setRequestHandler(
      IaSdkInternal.requestTypes.PRESCRIPTION_PHOTO_SCANNED,
      handler
        ? async (payload: { imageData: string }) =>
            toNativeDecision(await handler(payload.imageData))
        : null
    );
  }

  /**
   * Called when the user scans an e-prescription (eRezept) QR code. Same rules
   * as `onPrescriptionPhotoScanned`.
   */
  get onEPrescriptionScanned(): EPrescriptionScanHandler | null {
    return this.ePrescriptionScanHandler;
  }

  set onEPrescriptionScanned(handler: EPrescriptionScanHandler | null) {
    this.ePrescriptionScanHandler = handler;
    IaSdkInternal.setRequestHandler(
      IaSdkInternal.requestTypes.E_PRESCRIPTION_SCANNED,
      handler
        ? async (payload: { rawCode: string; urls: string[] }) =>
            toNativeDecision(
              await handler({
                rawCode: payload.rawCode,
                urls: payload.urls ?? [],
              })
            )
        : null
    );
  }

  /**
   * Adds a listener for camera errors of the scanner opened with
   * `launchPrescriptionScanner` (iOS only).
   */
  addScannerCameraErrorListener(
    callback: (message: string) => void
  ): IaSdkSubscription {
    return IaSdkInternal.addEventListener<{ message: string }>(
      IaSdkInternal.events.SCANNER_CAMERA_ERROR,
      (event) => callback(event.message)
    );
  }
}

function toNativeDecision(decision: IaPrescriptionScanDecision): {
  decision: string;
  message: string | null;
} {
  return {
    decision: decision?.decision ?? 'performDefault',
    message: decision?.decision === 'error' ? decision.message : null,
  };
}

export default IaModulePrescription;

export { IaPrescriptionScannerType } from '@ihreapotheken/ia-sdk-interface';
export type {
  IaPrescriptionScanDecision,
  IaEPrescriptionScan,
  IaScannerCameraState,
} from '@ihreapotheken/ia-sdk-interface';
