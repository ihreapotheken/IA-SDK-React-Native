import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface NativePdfPrescription {
  data: string;
  insuranceType: string;
}

export interface Spec extends TurboModule {
  // Registration (renamed from 'register' to avoid C++ reserved keyword)
  registerModule?(): void;

  // iOS methods (callback-based)
  clearCartIOS?(completionHandler: (error: string | null) => void): void;

  transferPrescriptionsIOS?(
    images: string[] | null,
    pdfs: NativePdfPrescription[] | null,
    codes: string[] | null,
    orderId: string | null,
    completionHandler: (error: string | null) => void
  ): void;

  launchCartScreenIOS?(): void;

  // Android methods (event-based)
  clearCartAndroid?(): void;

  transferPrescriptionsAndroid?(
    images: string[] | null,
    pdfs: NativePdfPrescription[] | null,
    codes: string[] | null,
    orderId: string | null
  ): void;

  launchCartScreenAndroid?(): void;

  // iOS-only methods
  getCartDetailsIOS?(
    completionHandler: (result: string | null) => void
  ): void;

  deleteOrderHistoryIOS?(
    completionHandler: (error: string | null) => void
  ): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkOrdering');
