import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Native spec of the over-the-counter module. Internal to this package.
 */
export interface Spec extends TurboModule {
  registerModule(): void;

  // iOS only
  clearProductGridCache?(): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkOtc');
