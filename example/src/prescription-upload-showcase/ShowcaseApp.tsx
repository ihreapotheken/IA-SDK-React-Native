import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './HomeScreen';

/**
 * Client showcase of transferring prescriptions to a local pharmacy with the
 * SDK, with the NativeScript demo's modules: ordering, pharmacy and
 * prescription, without over-the-counter and CardLink.
 */
export default function ShowcaseApp() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}
