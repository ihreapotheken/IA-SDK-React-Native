import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  registerModule?(): void;

  launchRedeemPrescriptionScreenIOS?(): void;

  launchRedeemPrescriptionScreenAndroid?(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkPrescription');
