import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  type GestureResponderEvent,
} from 'react-native';
import { APPSDK_ACCESS_KEY } from '@env';
import { ANDROID_APPSDK_VERSION, IOS_APPSDK_VERSION } from './generatedEnvConfig';
import {
  iaSdk,
  ServerEnvironment,
  Salutation,
  IaBaseModule,
} from '@ihreapotheken/ia-sdk-core';

if (!APPSDK_ACCESS_KEY) {
  throw new Error('APPSDK_ACCESS_KEY is missing. Please add it to your .secrets file.');
}
import type {
  IaOrderingModule,
  IaPharmacyModule,
  IaCardLinkModule,
} from '@ihreapotheken/ia-sdk-interface';
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
import { CardLinkView } from './views';

type TabName = 'home' | 'cardlink';

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

// Store module instance for CardLink view
let cardLinkModuleInstance: IaModuleCardLink | null = null;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardLinkModule, setCardLinkModule] = useState<IaModuleCardLink | null>(null);

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
        cardLinkModuleInstance = new IaModuleCardLink();
        await iaSdk.register([
          new IaModuleOrdering(),
          new IaModuleOverTheCounter(),
          new IaModulePharmacy(),
          new IaModulePrescription(),
          cardLinkModuleInstance,
        ]);
        console.log('SDK modules registered successfully.');
        setCardLinkModule(cardLinkModuleInstance);
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

  // --- New API test handlers ---

  const handleIsInitialized = async () => {
    try {
      const result = await iaSdk.isInitialized();
      Alert.alert('isInitialized', `${result}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await iaSdk.deleteUser();
      Alert.alert('Success', 'User deleted successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleGetEnvironment = async () => {
    try {
      const env = await iaSdk.getEnvironment();
      Alert.alert('Environment', `${env}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCleanCache = async () => {
    try {
      await iaSdk.cleanCache(true, true);
      Alert.alert('Success', 'Cache cleaned successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleGetPharmacyId = async () => {
    try {
      const pharmacy = iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);
      const pharmacyId = await pharmacy.getPharmacyId();
      Alert.alert('Pharmacy ID', `${pharmacyId ?? 'null'}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleGetCartDetails = async () => {
    try {
      const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
      const details = await ordering.getCartDetails();
      Alert.alert('Cart Details', `${details ?? 'null'}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteOrderHistory = async () => {
    try {
      const ordering = iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering);
      await ordering.deleteOrderHistory();
      Alert.alert('Success', 'Order history deleted successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCardLinkFinish = async () => {
    try {
      const cl = iaSdk.getModule<IaCardLinkModule>(IaBaseModule.CardLink);
      await cl.finish();
      Alert.alert('Success', 'CardLink finished successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const renderHomeTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>IA SDK React Native Example</Text>
      <Text style={styles.subtitle}>
        {Platform.OS === 'ios' ? 'iOS' : 'Android'}{' '}
        {Platform.OS === 'ios' ? IOS_APPSDK_VERSION : ANDROID_APPSDK_VERSION}
      </Text>

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

      <View style={styles.buttonContainer}>
        <AppButton
          title="IS INITIALIZED"
          onPress={handleIsInitialized}
        />
      </View>

      {Platform.OS === 'ios' && (
        <View style={styles.buttonContainer}>
          <AppButton
            title="DELETE USER"
            onPress={handleDeleteUser}
            disabled={!isInitialized}
          />
        </View>
      )}

      {Platform.OS === 'ios' && (
        <View style={styles.buttonContainer}>
          <AppButton
            title="GET ENVIRONMENT"
            onPress={handleGetEnvironment}
            disabled={!isInitialized}
          />
        </View>
      )}

      {Platform.OS === 'ios' && (
        <View style={styles.buttonContainer}>
          <AppButton
            title="CLEAN CACHE"
            onPress={handleCleanCache}
            disabled={!isInitialized}
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <AppButton
          title="GET PHARMACY ID"
          onPress={handleGetPharmacyId}
          disabled={!isInitialized}
        />
      </View>

      {Platform.OS === 'ios' && (
        <View style={styles.buttonContainer}>
          <AppButton
            title="GET CART DETAILS"
            onPress={handleGetCartDetails}
            disabled={!isInitialized}
          />
        </View>
      )}

      {Platform.OS === 'ios' && (
        <View style={styles.buttonContainer}>
          <AppButton
            title="DELETE ORDER HISTORY"
            onPress={handleDeleteOrderHistory}
            disabled={!isInitialized}
          />
        </View>
      )}

      {Platform.OS === 'ios' && (
        <View style={styles.buttonContainer}>
          <AppButton
            title="CARDLINK FINISH"
            onPress={handleCardLinkFinish}
            disabled={!isInitialized}
          />
        </View>
      )}
    </ScrollView>
  );

  const renderCardLinkTab = () => {
    if (!cardLinkModule) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading CardLink module...</Text>
        </View>
      );
    }
    return <CardLinkView cardLinkModule={cardLinkModule} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'cardlink' && renderCardLinkTab()}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'home' && styles.tabActive]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cardlink' && styles.tabActive]}
          onPress={() => setActiveTab('cardlink')}
        >
          <Text style={[styles.tabText, activeTab === 'cardlink' && styles.tabTextActive]}>
            CardLink
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Overlay (Home tab only) */}
      {isLoading && activeTab === 'home' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : undefined,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    alignItems: 'center',
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20, // Safe area padding
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
