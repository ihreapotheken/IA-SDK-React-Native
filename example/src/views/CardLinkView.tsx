import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  IaModuleCardLink,
  IaCardLinkFlowType,
  IaCardLinkConsentStatus,
  IaCardLinkEnvironment,
  IaCardLinkFinishAction,
  IaCardLinkIllustrationColor,
  IaCardLinkSessionMockResponse,
  IaCardLinkVerificationMockResponse,
  type IaCardLinkLaunchOptions,
} from '@ihreapotheken/ia-sdk-cardlink';
import { APPSDK_ACCESS_KEY } from '@env';
import { eventLog, useEventLog } from '../testing/eventLog';
import { ChoiceChips, EventList, Section, styles as ui, SwitchRow } from './ui';

interface CardLinkViewProps {
  cardLinkModule: IaModuleCardLink;
}

type EnvironmentChoice = 'sdk' | IaCardLinkEnvironment;

const CONSENT_OPTIONS = [
  { value: IaCardLinkConsentStatus.ShowConsent, label: 'Show Consent' },
  { value: IaCardLinkConsentStatus.ConsentAccepted, label: 'Accepted' },
  { value: IaCardLinkConsentStatus.ConsentDeclined, label: 'Declined' },
] as const;

const ENVIRONMENT_OPTIONS = [
  { value: 'sdk', label: 'SDK environment' },
  { value: IaCardLinkEnvironment.Debug, label: 'Debug' },
  { value: IaCardLinkEnvironment.Production, label: 'Production' },
] as const;

const FINISH_ACTION_OPTIONS = [
  { value: IaCardLinkFinishAction.UploadPrescriptions, label: 'Upload' },
  { value: IaCardLinkFinishAction.SendRawPrescriptions, label: 'Send raw' },
] as const;

const ILLUSTRATION_COLOR_OPTIONS = Object.values(IaCardLinkIllustrationColor).map(
  (value) => ({ value, label: value.toLowerCase() })
);

function SmallButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.smallButton} onPress={onPress} disabled={disabled}>
      <Text style={styles.smallButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function CardLinkView({ cardLinkModule }: CardLinkViewProps) {
  // Form state. The card name is empty by default: on Android a card name
  // always starts with a saved card, which never offers to save the card.
  const [userId, setUserId] = useState('test_user_001');
  const [cardName, setCardName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+491234567890');
  const [canCode, setCanCode] = useState('');
  const [pharmacyId, setPharmacyId] = useState('2163');
  const [consentStatus, setConsentStatus] = useState<IaCardLinkConsentStatus>(
    IaCardLinkConsentStatus.ShowConsent
  );
  const [saveCardEnabled, setSaveCardEnabled] = useState(true);
  const [environment, setEnvironment] = useState<EnvironmentChoice>(IaCardLinkEnvironment.Debug);
  const [finishAction, setFinishAction] = useState<IaCardLinkFinishAction>(
    IaCardLinkFinishAction.UploadPrescriptions
  );
  const [illustrationColor, setIllustrationColor] = useState<IaCardLinkIllustrationColor>(
    IaCardLinkIllustrationColor.Red
  );
  const [usesCustomColors, setUsesCustomColors] = useState(false);
  const [supportsLiquidGlass, setSupportsLiquidGlass] = useState(false);
  const [areMocksEnabled, setAreMocksEnabled] = useState(false);

  // Results state
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const cardLinkEvents = useEventLog(eventLog).filter((entry) =>
    entry.source.startsWith('CardLink')
  );

  const withLoading = async <T,>(
    action: () => Promise<T>,
    successMessage?: string
  ): Promise<T | undefined> => {
    setIsLoading(true);
    setResult('');
    try {
      const value = await action();
      if (successMessage) {
        setResult(successMessage);
      } else if (value !== undefined && value !== null) {
        setResult(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
      } else {
        setResult('Success');
      }
      return value;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const message = error instanceof Error ? error.message : String(error);
      setResult(`Error${code ? ` ${code}` : ''}: ${message}`);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const launchOptions = (flowType: IaCardLinkFlowType): IaCardLinkLaunchOptions => ({
    sdkApiKey: APPSDK_ACCESS_KEY ?? '',
    flowType,
    pharmacyId,
    consentStatus,
    phoneNumber,
    userId,
    canCode: canCode || undefined,
    cardName: cardName || undefined,
    environment: environment === 'sdk' ? undefined : environment,
    saveCardEnabled,
    finishAction,
    illustrationColor,
    supportsLiquidGlass: Platform.OS === 'ios' ? supportsLiquidGlass : undefined,
    ...(usesCustomColors
      ? {
          primaryColor: 0xff2e7d32,
          buttonsColor: 0xff2e7d32,
          textLinkColor: 0xff1565c0,
          bottomNavigationColor: 0xff1b5e20,
        }
      : {}),
  });

  // Launch
  const handleLaunchCardLink = () =>
    withLoading(
      () => cardLinkModule.launch(launchOptions(IaCardLinkFlowType.CardLink)),
      'CardLink launched'
    );

  const handleLaunchSavedCards = () =>
    withLoading(
      () => cardLinkModule.launch(launchOptions(IaCardLinkFlowType.SavedCards)),
      'Saved Cards launched'
    );

  // Card management
  const handleUpdateCard = () =>
    withLoading(async () => {
      const cards = await cardLinkModule.getSavedCardList(userId);
      const card = cards[0];
      if (!card) {
        return 'No saved card to update';
      }
      const name = card.name.endsWith(' (edited)') ? card.name : `${card.name} (edited)`;
      await cardLinkModule.updateCard({
        userId,
        originalName: card.name,
        name,
        phoneNumber: card.phoneNumber ?? phoneNumber,
        canCode: card.canCode ?? '',
      });
      return `Renamed "${card.name}" to "${name}"`;
    });

  const handleReorderCards = () =>
    withLoading(async () => {
      const cards = await cardLinkModule.getSavedCardList(userId);
      const canCodes = cards
        .map((card) => card.canCode)
        .filter((code): code is string => !!code)
        .reverse();
      await cardLinkModule.reorderSavedCards(userId, canCodes);
      return `New order: ${canCodes.join(', ') || 'no cards'}`;
    });

  const handleToggleMocks = () =>
    withLoading(async () => {
      const isEnabled = !areMocksEnabled;
      await cardLinkModule.setMocks({
        isMockingEnabled: isEnabled,
        sessionResponse: IaCardLinkSessionMockResponse.Auto,
        verificationResponse: IaCardLinkVerificationMockResponse.Success,
      });
      setAreMocksEnabled(isEnabled);
      return `Mocks ${isEnabled ? 'enabled' : 'disabled'}`;
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={ui.scrollContent}>
      <Section title="Configuration">
        <Text style={styles.label}>User ID</Text>
        <TextInput style={styles.input} value={userId} onChangeText={setUserId} placeholder="User ID" />

        <Text style={styles.label}>Saved Card Name (optional)</Text>
        <TextInput
          style={styles.input}
          value={cardName}
          onChangeText={setCardName}
          placeholder="Starts with this saved card"
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
        <ChoiceChips options={CONSENT_OPTIONS} selected={consentStatus} onSelect={setConsentStatus} />

        <Text style={styles.label}>Environment</Text>
        <ChoiceChips options={ENVIRONMENT_OPTIONS} selected={environment} onSelect={setEnvironment} />

        {Platform.OS === 'ios' && (
          <>
            <Text style={styles.label}>Finish Action (iOS)</Text>
            <ChoiceChips options={FINISH_ACTION_OPTIONS} selected={finishAction} onSelect={setFinishAction} />
          </>
        )}

        {Platform.OS === 'android' && (
          <>
            <Text style={styles.label}>Illustration Color (Android)</Text>
            <ChoiceChips
              options={ILLUSTRATION_COLOR_OPTIONS}
              selected={illustrationColor}
              onSelect={setIllustrationColor}
            />
          </>
        )}

        <SwitchRow title="Save card enabled" value={saveCardEnabled} onValueChange={setSaveCardEnabled} />
        <SwitchRow
          title="Custom colors"
          description="Green primary and buttons, blue links"
          value={usesCustomColors}
          onValueChange={setUsesCustomColors}
        />
        <SwitchRow
          title="Liquid Glass"
          description="SDK-wide setting"
          platform="ios"
          value={supportsLiquidGlass}
          onValueChange={setSupportsLiquidGlass}
        />
      </Section>

      <Section title="Launch">
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
        <View style={styles.buttonRow}>
          <SmallButton
            title="Finish (iOS)"
            disabled={isLoading}
            onPress={() => withLoading(() => cardLinkModule.finish(), 'Finished')}
          />
          {Platform.OS === 'ios' && (
            <SmallButton
              title={areMocksEnabled ? 'Disable Mocks' : 'Enable Mocks'}
              disabled={isLoading}
              onPress={handleToggleMocks}
            />
          )}
        </View>
      </Section>

      <Section title="SDK Info">
        <View style={styles.buttonRow}>
          <SmallButton
            title="Version"
            disabled={isLoading}
            onPress={() => withLoading(async () => `Version: ${(await cardLinkModule.getVersion()) ?? 'n/a'}`)}
          />
          <SmallButton
            title="Environment"
            disabled={isLoading}
            onPress={() => withLoading(async () => `Environment: ${await cardLinkModule.getEnvironment()}`)}
          />
          <SmallButton
            title="Log Path"
            disabled={isLoading}
            onPress={() => withLoading(async () => `Log path: ${(await cardLinkModule.getLogFilePath()) ?? 'n/a'}`)}
          />
        </View>
        <View style={styles.buttonRow}>
          <SmallButton
            title="Set Host Log File"
            disabled={isLoading}
            onPress={() =>
              withLoading(
                () => cardLinkModule.setHostAppLogFilePath('/tmp/ia-host-app.log'),
                'Host log file set'
              )
            }
          />
          <SmallButton
            title="Clear Host Log File"
            disabled={isLoading}
            onPress={() => withLoading(() => cardLinkModule.setHostAppLogFilePath(''), 'Host log file cleared')}
          />
        </View>
      </Section>

      <Section title="Card Management">
        <View style={styles.buttonRow}>
          <SmallButton
            title="Get Cards (JSON)"
            disabled={isLoading}
            onPress={() => withLoading(async () => (await cardLinkModule.getSavedCards(userId)) ?? 'No saved cards')}
          />
          <SmallButton
            title="Get Card List"
            disabled={isLoading}
            onPress={() => withLoading(() => cardLinkModule.getSavedCardList(userId))}
          />
          <SmallButton
            title="Delete Card"
            disabled={isLoading || !cardName}
            onPress={() => withLoading(() => cardLinkModule.deleteCard(userId, cardName), 'Card deleted')}
          />
        </View>
        {Platform.OS === 'android' && (
          <View style={styles.buttonRow}>
            <SmallButton title="Rename First Card" disabled={isLoading} onPress={handleUpdateCard} />
            <SmallButton title="Reverse Card Order" disabled={isLoading} onPress={handleReorderCards} />
          </View>
        )}
        <View style={styles.buttonRow}>
          <SmallButton
            title="Delete All Cards"
            disabled={isLoading}
            onPress={() =>
              withLoading(async () => (await cardLinkModule.deleteAllCards()) ?? 'All CardLink data cleared')
            }
          />
          <SmallButton
            title="Clear User Data"
            disabled={isLoading}
            onPress={() => withLoading(() => cardLinkModule.deleteAllUserRelatedData(), 'User data deleted')}
          />
        </View>
        <Text style={ui.hint}>Delete Card deletes the saved card named above.</Text>
      </Section>

      <Section title="Result">
        {isLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={styles.resultText}>{result || 'No result yet'}</Text>
        )}
      </Section>

      <Section
        title="CardLink Events"
        right={
          <TouchableOpacity onPress={() => eventLog.clear()}>
            <Text style={ui.linkText}>Clear all events</Text>
          </TouchableOpacity>
        }
      >
        <EventList entries={cardLinkEvents.slice(0, 50)} emptyText="No CardLink events yet" />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
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
  resultText: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
});

export default CardLinkView;
