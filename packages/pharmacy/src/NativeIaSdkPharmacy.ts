import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  registerModule?(): void;
  launchPharmacyDetailsIOS?(): void;
  launchPharmacyDetailsAndroid?(): void;
  setPharmacyIdIOS?(pharmacyId: string): void;
  setPharmacyIdAndroid?(pharmacyId: string): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkPharmacy');
