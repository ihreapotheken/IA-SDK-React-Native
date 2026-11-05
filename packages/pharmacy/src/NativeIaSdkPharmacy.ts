import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Native spec of the pharmacy module. Internal to this package.
 */
export interface Spec extends TurboModule {
  registerModule(): void;
  setPharmacyId(pharmacyId: string): Promise<void>;
  getPharmacyId(): Promise<string | null>;
  clearPharmacyId(): Promise<void>;

  // iOS only
  savePharmacyId?(pharmacyId: string): Promise<void>;
  getPharmacy?(allowCached: boolean): Promise<Object | null>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkPharmacy');
