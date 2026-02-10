import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  IaModuleCardLink,
  IaCardLinkFlowType,
  IaCardLinkConsentStatus,
  IaCardLinkEnvironment,
  type IaCardLinkSession,
  type IaCardLinkEventSubscription,
} from '@ihreapotheken/ia-sdk-cardlink';
import { APPSDK_ACCESS_KEY } from '@env';

interface EventLogEntry {
  timestamp: string;
  type: string;
  data: string;
}

interface CardLinkViewProps {
  cardLinkModule: IaModuleCardLink;
}

export function CardLinkView({ cardLinkModule }: CardLinkViewProps) {
  // Form state
  const [userId, setUserId] = useState('test_user_001');
  const [cardName, setCardName] = useState('My Health Card');
  const [phoneNumber, setPhoneNumber] = useState('+491234567890');
  const [canCode, setCanCode] = useState('');
  const [pharmacyId, setPharmacyId] = useState('2163');
  const [consentStatus, setConsentStatus] = useState<IaCardLinkConsentStatus>(
    IaCardLinkConsentStatus.ShowConsent
  );
  const [saveCardEnabled, setSaveCardEnabled] = useState(true);

  // Results state
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  const addEventLog = useCallback((type: string, data: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog((prev) => [{ timestamp, type, data }, ...prev.slice(0, 49)]);
  }, []);

  // Setup event listeners on mount
  useEffect(() => {
    const subs: IaCardLinkEventSubscription[] = [];

    // Consent events
    subs.push(
      cardLinkModule.addConsentEventListener((event) => {
        addEventLog('Consent', event);
      })
    );

    // Session created events
    subs.push(
      cardLinkModule.addSessionCreatedListener((session: IaCardLinkSession) => {
        addEventLog(
          'Session',
          `ID: ${session.cardSessionId}, Expires: ${session.sessionExpireTimestamp}`
        );
      })
    );

    // Prescriptions redeemed events
    subs.push(
      cardLinkModule.addPrescriptionsRedeemedListener((prescriptions) => {
        addEventLog('Prescriptions', prescriptions.substring(0, 100) + '...');
      })
    );

    // General events
    subs.push(
      cardLinkModule.addEventListener((event) => {
        addEventLog('Event', event);
      })
    );

    // Analytics events
    subs.push(
      cardLinkModule.addAnalyticsEventListener((eventName) => {
        addEventLog('Analytics', eventName);
      })
    );

    return () => {
      subs.forEach((sub) => sub.remove());
    };
  }, [cardLinkModule, addEventLog]);

  const withLoading = async <T,>(
    action: () => Promise<T>,
    successMessage?: string
  ): Promise<T | undefined> => {
    setIsLoading(true);
    setResult('');
    try {
      const result = await action();
      if (successMessage) {
        setResult(successMessage);
      } else if (result !== undefined && result !== null) {
        setResult(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      } else {
        setResult('Success');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`Error: ${errorMessage}`);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  // Launch CardLink
  const handleLaunchCardLink = () =>
    withLoading(async () => {
      await cardLinkModule.launch({
        sdkApiKey: APPSDK_ACCESS_KEY,
        flowType: IaCardLinkFlowType.CardLink,
        pharmacyId,
        consentStatus,
        phoneNumber,
        userId,
        canCode: canCode || undefined,
        cardName: cardName || undefined,
        environment: IaCardLinkEnvironment.Debug,
        saveCardEnabled,
      });
    }, 'CardLink launched');

  // Launch Saved Cards
  const handleLaunchSavedCards = () =>
    withLoading(async () => {
      await cardLinkModule.launch({
        sdkApiKey: APPSDK_ACCESS_KEY,
        flowType: IaCardLinkFlowType.SavedCards,
        pharmacyId,
        consentStatus,
        phoneNumber,
        userId,
        environment: IaCardLinkEnvironment.Debug,
      });
    }, 'Saved Cards launched');

  // SDK Info methods
  const handleGetVersion = () =>
    withLoading(async () => {
      const version = await cardLinkModule.getVersion();
      return `Version: ${version ?? 'Not available'}`;
    });

  const handleGetEnvironment = () =>
    withLoading(async () => {
      const env = await cardLinkModule.getEnvironment();
      return `Environment: ${env}`;
    });

  const handleGetLogFilePath = () =>
    withLoading(async () => {
      const path = await cardLinkModule.getLogFilePath();
      return `Log path: ${path ?? 'Not available'}`;
    });

  // Card management
  const handleGetSavedCards = () =>
    withLoading(async () => {
      const cards = await cardLinkModule.getSavedCards(userId);
      return cards ?? 'No saved cards';
    });

  const handleDeleteCard = () =>
    withLoading(async () => {
      await cardLinkModule.deleteCard(userId, cardName);
    }, 'Card deleted');

  const handleDeleteAllCards = () =>
    withLoading(async () => {
      const status = await cardLinkModule.deleteAllCards();
      return status ?? 'Not supported on this platform';
    });

  const handleDeleteAllUserData = () =>
    withLoading(async () => {
      await cardLinkModule.deleteAllUserRelatedData();
    }, 'User data deleted');

  const clearEventLog = () => setEventLog([]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CardLink Module Demo</Text>

      {/* Configuration Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>

        <Text style={styles.label}>User ID</Text>
        <TextInput
          style={styles.input}
          value={userId}
          onChangeText={setUserId}
          placeholder="User ID"
        />

        <Text style={styles.label}>Card Name</Text>
        <TextInput
          style={styles.input}
          value={cardName}
          onChangeText={setCardName}
          placeholder="Card Name"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+49..."
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>CAN Code (optional)</Text>
        <TextInput
          style={styles.input}
          value={canCode}
          onChangeText={setCanCode}
          placeholder="6-digit CAN"
          keyboardType="numeric"
          maxLength={6}
        />

        <Text style={styles.label}>Pharmacy ID</Text>
        <TextInput
          style={styles.input}
          value={pharmacyId}
          onChangeText={setPharmacyId}
          placeholder="Pharmacy ID"
        />

        <Text style={styles.label}>Consent Status</Text>
        <View style={styles.radioGroup}>
          {[
            { label: 'Show Consent', value: IaCardLinkConsentStatus.ShowConsent },
            { label: 'Accepted', value: IaCardLinkConsentStatus.ConsentAccepted },
            { label: 'Declined', value: IaCardLinkConsentStatus.ConsentDeclined },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.radioOption}
              onPress={() => setConsentStatus(option.value)}
            >
              <View
                style={[
                  styles.radio,
                  consentStatus === option.value && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.buttonRow, { marginTop: 12 }]}>
          <TouchableOpacity
            style={[
              styles.smallButton,
              saveCardEnabled && styles.smallButtonActive,
            ]}
            onPress={() => setSaveCardEnabled((prev) => !prev)}
          >
            <Text
              style={[
                styles.smallButtonText,
                saveCardEnabled && styles.smallButtonTextActive,
              ]}
            >
              {saveCardEnabled ? 'Save Card: ON' : 'Save Card: OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.clearAllButton]}
            onPress={() => {
              setUserId('');
              setCardName('');
              setPhoneNumber('');
              setCanCode('');
              setPharmacyId('');
              setConsentStatus(IaCardLinkConsentStatus.ShowConsent);
              setSaveCardEnabled(true);
            }}
          >
            <Text style={[styles.smallButtonText, styles.clearAllButtonText]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Launch Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Launch</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleLaunchCardLink}
            disabled={isLoading}
          >
            <Text style={styles.buttonTextWhite}>Launch CardLink</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleLaunchSavedCards}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Saved Cards</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SDK Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SDK Info</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={handleGetVersion}
            disabled={isLoading}
          >
            <Text style={styles.smallButtonText}>Version</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={handleGetEnvironment}
            disabled={isLoading}
          >
            <Text style={styles.smallButtonText}>Environment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={handleGetLogFilePath}
            disabled={isLoading}
          >
            <Text style={styles.smallButtonText}>Log Path</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Management</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={handleGetSavedCards}
            disabled={isLoading}
          >
            <Text style={styles.smallButtonText}>Get Cards</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={handleDeleteCard}
            disabled={isLoading}
          >
            <Text style={styles.smallButtonText}>Delete Card</Text>
          </TouchableOpacity>
        </View>
        {Platform.OS === 'ios' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={handleDeleteAllCards}
              disabled={isLoading}
            >
              <Text style={styles.smallButtonText}>Delete All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={handleDeleteAllUserData}
              disabled={isLoading}
            >
              <Text style={styles.smallButtonText}>Clear User Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Result Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Result</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={styles.resultText}>{result || 'No result yet'}</Text>
        )}
      </View>

      {/* Event Log Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Event Log</Text>
          <TouchableOpacity onPress={clearEventLog}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.eventLog}>
          {eventLog.length === 0 ? (
            <Text style={styles.eventLogEmpty}>No events yet</Text>
          ) : (
            eventLog.map((entry, index) => (
              <View key={index} style={styles.eventLogEntry}>
                <Text style={styles.eventLogTime}>{entry.timestamp}</Text>
                <Text style={styles.eventLogType}>[{entry.type}]</Text>
                <Text style={styles.eventLogData} numberOfLines={2}>
                  {entry.data}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 6,
  },
  radioSelected: {
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    fontSize: 13,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    fontWeight: '600',
    color: '#333',
  },
  buttonTextWhite: {
    fontWeight: '600',
    color: '#fff',
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  smallButtonText: {
    fontSize: 12,
    color: '#333',
  },
  smallButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  smallButtonTextActive: {
    color: '#fff',
  },
  clearAllButton: {
    borderColor: '#FF3B30',
  },
  clearAllButtonText: {
    color: '#FF3B30',
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  clearButton: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 12,
  },
  eventLog: {
    maxHeight: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 8,
  },
  eventLogEmpty: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 12,
  },
  eventLogEntry: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  eventLogTime: {
    color: '#888',
    fontSize: 10,
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  eventLogType: {
    color: '#4CAF50',
    fontSize: 10,
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  eventLogData: {
    color: '#fff',
    fontSize: 10,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default CardLinkView;
