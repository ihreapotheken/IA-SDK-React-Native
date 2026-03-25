import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // iOS methods (callback-based)
  initIaSdkIOS?(
    accessKey: string,
    clientId: string,
    serverEnvironmentId: string,
    channelId: number | null,
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

  finishAllActivitiesIOS?(): void;

  // Android methods (callback-based)
  initIaSdkAndroid?(
    accessKey: string,
    clientId: string,
    serverEnvironmentId: string,
    channelId: number | null,
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

  finishAllActivitiesAndroid?(): void;

  transferSDKv1UserDataIOS?(): void;

  transferSDKv1UserDataAndroid?(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkCore');
