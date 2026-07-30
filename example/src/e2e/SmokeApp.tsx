import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { APPSDK_ACCESS_KEY } from '@env';
import { iaSdk, ServerEnvironment } from '@ihreapotheken/ia-sdk-core';
import { IaModuleOrdering } from '@ihreapotheken/ia-sdk-ordering';
import { IaModuleOverTheCounter } from '@ihreapotheken/ia-sdk-over-the-counter';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';
import { IaModulePrescription } from '@ihreapotheken/ia-sdk-prescription';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';

/**
 * Minimal E2E smoke entry (selected via IA_E2E — see index.js).
 *
 * Verifies only what a cross-platform integration test needs: the app launches
 * without crashing and iaSdk.initialize() completes successfully. On mount it
 * registers the modules and initializes the SDK, then shows a stable
 * "SDK initialized" marker (or the error). The Maestro smoke flow launches the
 * app and asserts that marker.
 */
export default function SmokeApp() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await iaSdk.register([
          new IaModuleOrdering(),
          new IaModuleOverTheCounter(),
          new IaModulePharmacy(),
          new IaModulePrescription(),
          new IaModuleCardLink(),
        ]);
        await iaSdk.initialize({
          accessKey: APPSDK_ACCESS_KEY as string,
          clientId: '6001',
          serverEnvironment: ServerEnvironment.Staging,
        });
        setStatus('ok');
      } catch (e) {
        setError(String(e));
        setStatus('error');
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {status === 'loading' && <ActivityIndicator />}
      {status === 'ok' && (
        <Text accessibilityLabel="SDK initialized">SDK initialized</Text>
      )}
      {status === 'error' && (
        <Text accessibilityLabel="SDK init failed">SDK init failed: {error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
