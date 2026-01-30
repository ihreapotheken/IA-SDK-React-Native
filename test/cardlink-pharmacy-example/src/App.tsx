import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  type GestureResponderEvent,
} from 'react-native';
import {
  iaSdk,
  ServerEnvironment,
  Salutation,
  IaBaseModule,
} from '@ihreapotheken/ia-sdk-core';
import type { IaPharmacyModule } from '@ihreapotheken/ia-sdk-interface';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';
import { useEffect, useState } from 'react';

interface AppButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  color?: string;
}

function AppButton({
  title,
  onPress,
  disabled = false,
  color = '#000000',
}: AppButtonProps) {
  const textColor = disabled ? '#888888' : color;
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pharmacyId, setPharmacyId] = useState('');
  const [loadingInitialize, setLoadingInitialize] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingGuestUser, setLoadingGuestUser] = useState(false);
  const [loadingFinishActivities, setLoadingFinishActivities] = useState(false);
  const [loadingPharmacyDetails, setLoadingPharmacyDetails] = useState(false);
  const [loadingSetPharmacyId, setLoadingSetPharmacyId] = useState(false);

  // Register modules on mount
  useEffect(() => {
    const registerModules = async () => {
      try {
        console.log('Registering CardLink and Pharmacy modules...');
        await iaSdk.register([new IaModuleCardLink(), new IaModulePharmacy()]);
        console.log('Modules registered successfully.');
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

  const handleInitialize = async () => {
    setLoadingInitialize(true);
    try {
      console.log('Running SDK init...');
      await iaSdk.initialize({
        accessKey:
          '3a8c71f2b5d490e6a1f7c23d9e084b6c5f1a9d27e3c4b508d6f2a91c0e7b4d35',
        clientId: '5004',
        serverEnvironment: ServerEnvironment.Staging,
      });
      console.log('SDK initialized successfully!');
      setIsInitialized(true);
    } catch (e) {
      console.error('SDK init error:', e);
    } finally {
      setLoadingInitialize(false);
    }
  };

  const handleStartDashboard = async () => {
    setLoadingDashboard(true);
    try {
      await iaSdk.startDashboardActivity();
    } catch (e) {
      console.error('Start dashboard activity error:', e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await iaSdk.logout();
      console.log('Logout successful.');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoadingLogout(false);
    }
  };

  const handleSetGuestUserData = async () => {
    setLoadingGuestUser(true);
    try {
      await iaSdk.setGuestUserData({
        salutation: Salutation.NotDisclosed,
        firstName: 'First',
        lastName: 'Last',
        email: 'Email@email.com',
        phoneNumberCountryCode: 49,
        phoneNumberWithoutCountryCode: 24332442,
      });
      console.log('Guest user data set successfully.');
    } catch (e) {
      console.error('Set guest user data error:', e);
    } finally {
      setLoadingGuestUser(false);
    }
  };

  const handleFinishAllActivities = async () => {
    setLoadingFinishActivities(true);
    try {
      await iaSdk.finishAllActivities();
    } catch (e) {
      console.error('Finish all activities error:', e);
    } finally {
      setLoadingFinishActivities(false);
    }
  };

  const handleLaunchPharmacyDetails = async () => {
    setLoadingPharmacyDetails(true);
    try {
      const pharmacy = iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);
      await pharmacy.launchPharmacyDetails();
      console.log('Pharmacy details launched.');
    } catch (e) {
      console.error('Launch pharmacy details error:', e);
    } finally {
      setLoadingPharmacyDetails(false);
    }
  };

  const handleSetPharmacyId = async () => {
    if (!pharmacyId.trim()) {
      console.warn('Please enter a pharmacy ID');
      return;
    }
    setLoadingSetPharmacyId(true);
    try {
      const pharmacy = iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy);
      await pharmacy.setPharmacyId(pharmacyId.trim());
      console.log('Pharmacy ID set successfully:', pharmacyId.trim());
    } catch (e) {
      console.error('Set pharmacy ID error:', e);
    } finally {
      setLoadingSetPharmacyId(false);
    }
  };

  const isLoading =
    loadingInitialize ||
    loadingDashboard ||
    loadingLogout ||
    loadingGuestUser ||
    loadingFinishActivities ||
    loadingPharmacyDetails ||
    loadingSetPharmacyId;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IA SDK CardLink + Pharmacy Example</Text>
      <Text style={styles.subtitle}>CardLink & Pharmacy Modules</Text>

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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pharmacy Module</Text>
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="LAUNCH PHARMACY DETAILS"
          onPress={handleLaunchPharmacyDetails}
          disabled={!isInitialized}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Pharmacy ID"
          value={pharmacyId}
          onChangeText={setPharmacyId}
          editable={isInitialized}
        />
        <AppButton
          title="SET PHARMACY ID"
          onPress={handleSetPharmacyId}
          disabled={!isInitialized || !pharmacyId.trim()}
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
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
  sectionHeader: {
    marginTop: 20,
    marginBottom: 5,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    marginTop: 10,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
