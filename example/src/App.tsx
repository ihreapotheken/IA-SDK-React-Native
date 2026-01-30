import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  type GestureResponderEvent,
} from 'react-native';
import { APPSDK_ACCESS_KEY } from '@env';
import {
  iaSdk,
  ServerEnvironment,
  Salutation,
  IaBaseModule,
} from '@ihreapotheken/ia-sdk-core';

if (!APPSDK_ACCESS_KEY) {
  throw new Error('APPSDK_ACCESS_KEY is missing. Please add it to your .secrets file.');
}
import type { IaOrderingModule } from '@ihreapotheken/ia-sdk-interface';
import { IaModuleOrdering } from '@ihreapotheken/ia-sdk-ordering';
import { IaModuleOverTheCounter } from '@ihreapotheken/ia-sdk-over-the-counter';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';
import { IaModulePrescription } from '@ihreapotheken/ia-sdk-prescription';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';
import { useCallback, useEffect, useState } from 'react';
import {
  mockPngPrescription,
  mockJpgPrescription,
  mockPdfPrescription,
  mockEPrescriptionCode,
} from './testData';

interface AppButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  color?: string;
}

function AppButton({ title, onPress, disabled = false, color = '#000000' }: AppButtonProps) {
  const textColor = disabled ? '#888888' : color;
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = useCallback(async <T,>(callback: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true);
    try {
      return await callback();
    } catch (e) {
      console.error(e);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register modules on mount
  useEffect(() => {
    const registerModules = async () => {
      try {
        console.log('Registering SDK modules...');
        await iaSdk.register([
          new IaModuleOrdering(),
          new IaModuleOverTheCounter(),
          new IaModulePharmacy(),
          new IaModulePrescription(),
          new IaModuleCardLink(),
        ]);
        console.log('SDK modules registered successfully.');
        // Use setTimeout to ensure state update triggers re-render
        setTimeout(() => {
          setIsRegistered(true);
          console.log('isRegistered set to true');
        }, 100);
      } catch (e) {
        console.error('Module registration error:', e);
      }
    };
    registerModules();
  }, []);

  const handleInitialize = () =>
    withLoading(async () => {
      console.log('Running SDK init...');
      console.log('isRegistered:', isRegistered, 'isInitialized:', isInitialized);
      await iaSdk.initialize({
        accessKey: APPSDK_ACCESS_KEY as string,
        clientId: '6001',
        serverEnvironment: ServerEnvironment.Staging,
      });
      console.log('SDK initialized successfully!');
      setIsInitialized(true);
    });

  const handleStartDashboard = () =>
    withLoading(async () => {
      await iaSdk.startDashboardActivity();
    });

  const handleLogout = () =>
    withLoading(async () => {
      await iaSdk.logout();
      console.log('Logout successful.');
    });

  const handleSetGuestUserData = () =>
    withLoading(async () => {
      await iaSdk.setGuestUserData({
        salutation: Salutation.NotDisclosed,
        firstName: 'First',
        lastName: 'Last',
        email: 'Email@email.com',
        phoneNumberCountryCode: 49,
        phoneNumberWithoutCountryCode: 24332442,
      });
      console.log('Guest user data set successfully.');
    });

  const handleClearCart = () =>
    withLoading(async () => {
      const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
      await ordering.clearCart();
      console.log('Cart cleared successfully.');
    });

  const handleTransferPrescriptions = () =>
    withLoading(async () => {
      const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
      await ordering.transferPrescriptions({
        images: [mockPngPrescription, mockJpgPrescription],
        pdfs: [mockPdfPrescription],
        codes: [mockEPrescriptionCode],
        orderId: 'test-order-123',
      });
      console.log('Prescriptions transferred successfully.');
    });

  const handleLaunchCartScreen = () =>
    withLoading(async () => {
      const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
      await ordering.launchCartScreen();
    });

  const handleFinishAllActivities = () =>
    withLoading(async () => {
      await iaSdk.finishAllActivities();
    });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IA SDK React Native Example</Text>
      <Text style={styles.subtitle}>Modular Architecture Demo</Text>

      <Text style={styles.status}>
        Modules: {isRegistered ? 'Registered' : 'Not Registered'}
      </Text>
      <Text style={styles.status}>
        SDK: {isInitialized ? 'Initialized' : 'Not Initialized'}
      </Text>

      <View style={styles.buttonContainer}>
        <AppButton
          title={`INITIALIZE (${isRegistered ? 'Ready' : 'Wait'})`}
          onPress={handleInitialize}
          disabled={!isRegistered || isInitialized}
        />
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="START DASHBOARD ACTIVITY"
          onPress={handleStartDashboard}
          disabled={!isInitialized}
        />
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="LOGOUT"
          onPress={handleLogout}
          disabled={!isInitialized}
        />
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="SET GUEST USER DATA"
          onPress={handleSetGuestUserData}
          disabled={!isInitialized}
        />
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="CLEAR CART"
          onPress={handleClearCart}
          disabled={!isInitialized}
        />
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="TRANSFER PRESCRIPTIONS"
          onPress={handleTransferPrescriptions}
          disabled={!isInitialized}
        />
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="LAUNCH CART SCREEN"
          onPress={handleLaunchCartScreen}
          disabled={!isInitialized}
        />
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="FINISH ALL ACTIVITIES"
          onPress={handleFinishAllActivities}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  status: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 10,
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
