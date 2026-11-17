import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Native spec of the CardLink module. Internal to this package.
 */
export interface Spec extends TurboModule {
  registerModule(): void;

  // Event emitter plumbing (RCTEventEmitter on iOS, no-op on Android).
  addListener(eventType: string): void;
  removeListeners(count: number): void;

  /** `options`: the fields of `IaCardLinkLaunchOptions`. */
  launch(options: Object): Promise<void>;
  getVersion(): Promise<string | null>;
  getEnvironment(): Promise<string>;
  getLogFilePath(): Promise<string | null>;
  /** JSON-encoded saved cards. */
  getSavedCards(userId: string): Promise<string>;
  deleteCard(userId: string, cardName: string): Promise<void>;
  deleteAllCards(): Promise<string | null>;
  deleteAllUserRelatedData(): Promise<void>;
  setHostAppLogFilePath(path: string): Promise<void>;
  /** Resolves right away on Android, which can't close CardLink. */
  finish(): Promise<void>;

  // Android only
  /** `params`: the fields of `IaCardLinkUpdateCardParams`. */
  updateCard?(params: Object): Promise<void>;
  reorderSavedCards?(
    userId: string,
    orderedCanCodes: Array<string>
  ): Promise<void>;

  // iOS only
  /** `mocks`: the fields of `IaCardLinkMocks`. */
  setMocks?(mocks: Object): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('IaSdkCardLink');
