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
} from '@ihreapotheken/ia-sdk-core';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';
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
  const [loadingInitialize, setLoadingInitialize] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingGuestUser, setLoadingGuestUser] = useState(false);
  const [loadingFinishActivities, setLoadingFinishActivities] = useState(false);

  // Register modules on mount
  useEffect(() => {
    const registerModules = async () => {
      try {
        console.log('Registering CardLink module...');
        await iaSdk.register([new IaModuleCardLink()]);
        console.log('CardLink module registered successfully.');
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

  const isLoading =
    loadingInitialize ||
    loadingDashboard ||
    loadingLogout ||
    loadingGuestUser ||
    loadingFinishActivities;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IA SDK CardLink Example</Text>
      <Text style={styles.subtitle}>CardLink Module Only</Text>

      <Text style={styles.status}>
        CardLink Module: {isRegistered ? 'Registered' : 'Not Registered'}
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
