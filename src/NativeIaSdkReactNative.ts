import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  // Initialise.

  initIaSdkIOS?(
    accessKey: string, 
    clientId: string, 
    serverEnvironmentId: string,
    completionHandler: (e: string | null) => void,
  ): void;

  initIaSdkAndroid?(
    accessKey: string, 
    clientId: string, 
    serverEnvironmentId: string,
  ): void;

  // Start dashboard activity.

  startDashboardActivityIOS?(): void;

  startDashboardActivityAndroid?(): void;

  // Logout.

  logoutIOS?(
    completionHandler: (e: string | null) => void,
  ): void;

  logoutAndroid?(): void;

  // Set guest user data.

  setGuestUserDataIOS?(
    salutation: string, 
    firstName: string, 
    lastName: string, 
    email: string, 
    phoneNumberCountryCode: string, 
    phoneNumberWithoutCountryCode: string,
    completionHandler: (e: string | null) => void,
  ): void;

  setGuestUserDataAndroid?(
    salutation: string, 
    firstName: string, 
    lastName: string, 
    email: string, 
    phoneNumberCountryCode: string,
    phoneNumberWithoutCountryCode: string,
  ): void;

  // Clear cart.

  clearCartIOS?(
    completionHandler: (e: string | null) => void,
  ): void;

  clearCartAndroid?(): void;

  // Transfer prescriptions.

  transferPrescriptionsIOS?(
    images: Array<string> | null, 
    pdfs: Array<string> | null, 
    codes: Array<string> | null, 
    orderId: string | null,
    completionHandler: (e: string | null) => void,
  ): void;

  transferPrescriptionsAndroid?(
    images: Array<string> | null, 
    pdfs: Array<string> | null, 
    codes: Array<string> | null, 
    orderId: string | null,
  ): void;

  // Finish all activities.

  finishAllActivitiesIOS?(): void;

  finishAllActivitiesAndroid?(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkReactNative');
