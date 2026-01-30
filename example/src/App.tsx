import { View, StyleSheet, Button } from 'react-native';
import { IaSdk, IaSdkBase } from '@ihreapotheken/ia-sdk-react-native';
import { APPSDK_ACCESS_KEY } from '@env';
if (!APPSDK_ACCESS_KEY) {
  throw new Error('APPSDK_ACCESS_KEY is missing. Please add it to your .secrets file.');
}
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  type GestureResponderEvent,
} from 'react-native';
import {
  iaSdk,
  ServerEnvironment,
  Salutation,
  IaBaseModule,
} from '@ihreapotheken/ia-sdk-core';
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
    <View style={styles.container}>
      <Button
        title="INITIALIZE"
        onPress={
          async () => {
            try {
              console.log("Running SDK init.");
              await iaSdk.initIaSdk(
                APPSDK_ACCESS_KEY,
                "6001",
                IaSdkBase.ServerEnvironment.Staging,
              );
              console.log("SDK initialized successfully.");
            } catch (e) {
              console.error("SDK init error:", e);
            }
          }
        }
        color="#000000"
      />
      <View style={{ marginTop: 20 }}>
        <Button
          title="START DASHBOARD ACTIVITY"
          onPress={
            async () => {
              try {
                await iaSdk.startDashboardActivity();
              } catch (e) {
                console.error("Start dashboard activity error:", e);
              }
            }
          }
          color="#000000"
        />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button
          title="LOGOUT"
          onPress={
            async () => {
              try {
                await iaSdk.logout();
              } catch (e) {
                console.error("Start dashboard activity error:", e);
              }
            }
          }
          color="#000000"
        />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button
          title="SET GUEST USER DATA"
          onPress={
            async () => {
              try {
                await iaSdk.setGuestUserData(
                  IaSdkBase.Salutation.NotDisclosed, 
                  'First', 
                  'Last', 
                  'Email@email.com', 
                  49, 
                  24332442,
                );
              } catch (e) {
                console.error("Start dashboard activity error:", e);
              }
            }
          }
          color="#000000"
        />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button
          title="CLEAR CART"
          onPress={
            async () => {
              try {
                await iaSdk.clearCart();
              } catch (e) {
                console.error("Start dashboard activity error:", e);
              }
            }
          }
          color="#000000"
        />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button
          title="TRANSFER PRESCRIPTIONS"
          onPress={
            async () => {
              try {
                await iaSdk.transferPrescriptions(
                  images, 
                  pdfs, 
                  ['{"urls":["Task\/test9ba2fee0d07e4ef2b6205f8012e1445b\/$accept?ac=5e24cc059ff244bdbb01efcccf834a6329bdac67a4a64733938fe1b799ac19a9"]}'], 
                  'AAAAAA',
                );
              } catch (e) {
                console.error("Start dashboard activity error:", e);
              }
            }
          }
          color="#000000"
        />
      </View>
    </View>
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
        accessKey: '3a8c71f2b5d490e6a1f7c23d9e084b6c5f1a9d27e3c4b508d6f2a91c0e7b4d35',
        clientId: '5004',
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
