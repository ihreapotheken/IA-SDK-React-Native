import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // iOS methods (callback-based)
  initIaSdkIOS?(
    accessKey: string,
    clientId: string,
    serverEnvironmentId: string,
    channelId: number | null,
    shouldFetchThemeFromRemote: boolean,
    completionHandler: (error: string | null) => void
  ): void;

  logoutIOS?(completionHandler: (error: string | null) => void): void;

  setGuestUserDataIOS?(
    salutation: string,
    firstName: string,
    lastName: string,
    email: string,
    phoneNumberCountryCode: string,
    phoneNumberWithoutCountryCode: string,
    completionHandler: (error: string | null) => void
  ): void;

  startDashboardActivityIOS?(): void;

  launchApofinderIOS?(): void;

  finishAllActivitiesIOS?(): void;

  // Android methods (callback-based)
  initIaSdkAndroid?(
    accessKey: string,
    clientId: string,
    serverEnvironmentId: string,
    channelId: number | null,
    shouldFetchThemeFromRemote: boolean,
    completionHandler: (error: string | null) => void
  ): void;

  logoutAndroid?(completionHandler: (error: string | null) => void): void;

  setGuestUserDataAndroid?(
    salutation: string,
    firstName: string,
    lastName: string,
    email: string,
    phoneNumberCountryCode: string,
    phoneNumberWithoutCountryCode: string,
    completionHandler: (error: string | null) => void
  ): void;

  startDashboardActivityAndroid?(): void;

  launchApofinderAndroid?(): void;

  finishAllActivitiesAndroid?(): void;

  transferSDKv1UserDataIOS?(): void;

  transferSDKv1UserDataAndroid?(): void;

  // isInitialized - both platforms
  isInitializedIOS?(completionHandler: (result: boolean) => void): void;
  isInitializedAndroid?(completionHandler: (result: boolean) => void): void;

  // deleteUser - iOS only
  deleteUserIOS?(completionHandler: (error: string | null) => void): void;

  // getEnvironment - iOS only
  getEnvironmentIOS?(
    completionHandler: (result: string | null) => void
  ): void;

  // cleanCache - iOS only
  cleanCacheIOS?(
    initialization: boolean,
    prerequisites: boolean,
    completionHandler: (error: string | null) => void
  ): void;

  // setUserBillingAddress - iOS only
  setUserBillingAddressIOS?(
    firstName: string,
    lastName: string,
    additionalInfo: string | null,
    street: string,
    houseNumber: string,
    zipCode: string,
    city: string,
    salutation: string | null,
    phoneNumberCountryCode: string | null,
    phoneNumberWithoutCountryCode: string | null,
    completionHandler: (error: string | null) => void
  ): void;

  // setUserDeliveryAddress - iOS only
  setUserDeliveryAddressIOS?(
    firstName: string,
    lastName: string,
    additionalInfo: string | null,
    street: string,
    houseNumber: string,
    zipCode: string,
    city: string,
    salutation: string | null,
    phoneNumberCountryCode: string | null,
    phoneNumberWithoutCountryCode: string | null,
    completionHandler: (error: string | null) => void
  ): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkCore');
