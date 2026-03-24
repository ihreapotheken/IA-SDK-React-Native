import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Registration
  registerModule?(): void;

  // Launch methods (platform-specific due to callback differences)
  launchIOS?(
    sdkApiKey: string,
    flowType: string,
    pharmacyId: string,
    consentStatus: string,
    phoneNumber: string,
    userId: string,
    canCode: string | null,
    cardName: string | null,
    primaryColor: number | null,
    buttonsColor: number | null,
    textLinkColor: number | null,
    bottomNavigationColor: number | null,
    environment: string | null,
    saveCardEnabled: boolean | null,
    completionHandler: (error: string | null) => void
  ): void;

  launchAndroid?(
    sdkApiKey: string,
    flowType: string,
    pharmacyId: string,
    consentStatus: string,
    phoneNumber: string,
    userId: string,
    canCode: string | null,
    cardName: string | null,
    primaryColor: number | null,
    buttonsColor: number | null,
    textLinkColor: number | null,
    bottomNavigationColor: number | null,
    environment: string | null,
    saveCardEnabled: boolean | null
  ): void;

  // iOS getter methods (with callbacks)
  getVersionIOS?(completionHandler: (result: string | null) => void): void;
  getEnvironmentIOS?(completionHandler: (result: string | null) => void): void;
  getLogFilePathIOS?(completionHandler: (result: string | null) => void): void;
  getSavedCardsIOS?(
    userId: string,
    completionHandler: (result: string | null) => void
  ): void;
  deleteCardIOS?(
    userId: string,
    cardName: string,
    completionHandler: (error: string | null) => void
  ): void;
  deleteAllCardsIOS?(
    completionHandler: (result: string | null) => void
  ): void;
  deleteAllUserRelatedDataIOS?(
    completionHandler: (error: string | null) => void
  ): void;

  // Android getter methods (event-based)
  getVersionAndroid?(): void;
  getEnvironmentAndroid?(): void;
  getLogFilePathAndroid?(): void;
  getSavedCardsAndroid?(userId: string): void;
  deleteCardAndroid?(userId: string, cardName: string): void;

  // Event listener management (both platforms)
  addListener?(eventType: string): void;
  removeListeners?(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkCardLink');
