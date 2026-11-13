import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Native spec of the prescription module. Internal to this package.
 *
 * Screens, scan callbacks and the scanner camera go through the core module,
 * which owns the SDK delegate/listeners and screen presentation.
 */
export interface Spec extends TurboModule {
  registerModule(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkPrescription');
