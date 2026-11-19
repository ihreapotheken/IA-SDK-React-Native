import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text } from 'react-native';
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
import {
  ActionRow,
  Button,
  CardBlock,
  ChoiceChips,
  colors,
  fonts,
  Hint,
  LinkButton,
  Section,
  shared,
  spacing,
  SwitchRow,
  TextField,
} from '@ia-example/shared';
import { EventList } from '../components/EventList';
import { TabScroll } from '../components/TabScroll';
import { eventLog, useEventLog } from '../testing/eventLog';

interface CardLinkTabProps {
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

const ILLUSTRATION_COLOR_OPTIONS = Object.values(
  IaCardLinkIllustrationColor
).map((value) => ({ value, label: value.toLowerCase() }));

export function CardLinkTab({ cardLinkModule }: CardLinkTabProps) {
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
  const [environment, setEnvironment] = useState<EnvironmentChoice>(
    IaCardLinkEnvironment.Debug
  );
  const [finishAction, setFinishAction] = useState<IaCardLinkFinishAction>(
    IaCardLinkFinishAction.UploadPrescriptions
  );
  const [illustrationColor, setIllustrationColor] =
    useState<IaCardLinkIllustrationColor>(IaCardLinkIllustrationColor.Red);
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
        setResult(
          typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        );
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

  const launchOptions = (
    flowType: IaCardLinkFlowType
  ): IaCardLinkLaunchOptions => ({
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
    supportsLiquidGlass:
      Platform.OS === 'ios' ? supportsLiquidGlass : undefined,
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
      const name = card.name.endsWith(' (edited)')
        ? card.name
        : `${card.name} (edited)`;
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
    <TabScroll>
      <Section title="Configuration">
        <CardBlock style={styles.fields}>
          <TextField label="User ID" value={userId} onChangeText={setUserId} />
          <TextField
            label="Saved card name (optional)"
            value={cardName}
            onChangeText={setCardName}
            placeholder="Starts with this saved card"
          />
          <TextField
            label="Phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+49..."
            keyboardType="phone-pad"
          />
          <TextField
            label="CAN code (optional)"
            value={canCode}
            onChangeText={setCanCode}
            placeholder="6-digit CAN"
            keyboardType="numeric"
            maxLength={6}
          />
          <TextField
            label="Pharmacy ID"
            value={pharmacyId}
            onChangeText={setPharmacyId}
          />
        </CardBlock>
        <CardBlock>
          <Text style={shared.subtitle}>Consent status</Text>
          <ChoiceChips
            options={CONSENT_OPTIONS}
            selected={consentStatus}
            onSelect={setConsentStatus}
          />
        </CardBlock>
        <CardBlock>
          <Text style={shared.subtitle}>Environment</Text>
          <ChoiceChips
            options={ENVIRONMENT_OPTIONS}
            selected={environment}
            onSelect={setEnvironment}
          />
        </CardBlock>
        {Platform.OS === 'ios' && (
          <CardBlock>
            <Text style={shared.subtitle}>Finish action (iOS)</Text>
            <ChoiceChips
              options={FINISH_ACTION_OPTIONS}
              selected={finishAction}
              onSelect={setFinishAction}
            />
          </CardBlock>
        )}
        {Platform.OS === 'android' && (
          <CardBlock>
            <Text style={shared.subtitle}>Illustration color (Android)</Text>
            <ChoiceChips
              options={ILLUSTRATION_COLOR_OPTIONS}
              selected={illustrationColor}
              onSelect={setIllustrationColor}
            />
          </CardBlock>
        )}
        <SwitchRow
          title="Save card enabled"
          value={saveCardEnabled}
          onValueChange={setSaveCardEnabled}
        />
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
        <CardBlock style={styles.launchButtons}>
          <Button
            title="Launch CardLink"
            onPress={handleLaunchCardLink}
            disabled={isLoading}
            style={styles.flexButton}
          />
          <Button
            title="Saved Cards"
            variant="secondary"
            onPress={handleLaunchSavedCards}
            disabled={isLoading}
            style={styles.flexButton}
          />
        </CardBlock>
        <ActionRow
          title="Finish"
          platform="ios"
          disabled={isLoading}
          onPress={() => withLoading(() => cardLinkModule.finish(), 'Finished')}
        />
        <ActionRow
          title={areMocksEnabled ? 'Disable Mocks' : 'Enable Mocks'}
          platform="ios"
          disabled={isLoading}
          onPress={handleToggleMocks}
        />
      </Section>

      <Section title="SDK Info">
        <ActionRow
          title="Version"
          disabled={isLoading}
          onPress={() =>
            withLoading(
              async () =>
                `Version: ${(await cardLinkModule.getVersion()) ?? 'n/a'}`
            )
          }
        />
        <ActionRow
          title="Environment"
          disabled={isLoading}
          onPress={() =>
            withLoading(
              async () =>
                `Environment: ${await cardLinkModule.getEnvironment()}`
            )
          }
        />
        <ActionRow
          title="Log Path"
          disabled={isLoading}
          onPress={() =>
            withLoading(
              async () =>
                `Log path: ${(await cardLinkModule.getLogFilePath()) ?? 'n/a'}`
            )
          }
        />
        <ActionRow
          title="Set Host Log File"
          disabled={isLoading}
          onPress={() =>
            withLoading(
              () =>
                cardLinkModule.setHostAppLogFilePath('/tmp/ia-host-app.log'),
              'Host log file set'
            )
          }
        />
        <ActionRow
          title="Clear Host Log File"
          disabled={isLoading}
          onPress={() =>
            withLoading(
              () => cardLinkModule.setHostAppLogFilePath(''),
              'Host log file cleared'
            )
          }
        />
      </Section>

      <Section title="Card Management">
        <ActionRow
          title="Get Cards (JSON)"
          disabled={isLoading}
          onPress={() =>
            withLoading(
              async () =>
                (await cardLinkModule.getSavedCards(userId)) ?? 'No saved cards'
            )
          }
        />
        <ActionRow
          title="Get Card List"
          disabled={isLoading}
          onPress={() =>
            withLoading(() => cardLinkModule.getSavedCardList(userId))
          }
        />
        <ActionRow
          title="Delete Card"
          description="Deletes the saved card named above"
          disabled={isLoading || !cardName}
          onPress={() =>
            withLoading(
              () => cardLinkModule.deleteCard(userId, cardName),
              'Card deleted'
            )
          }
        />
        <ActionRow
          title="Rename First Card"
          platform="android"
          disabled={isLoading}
          onPress={handleUpdateCard}
        />
        <ActionRow
          title="Reverse Card Order"
          platform="android"
          disabled={isLoading}
          onPress={handleReorderCards}
        />
        <ActionRow
          title="Delete All Cards"
          disabled={isLoading}
          onPress={() =>
            withLoading(
              async () =>
                (await cardLinkModule.deleteAllCards()) ??
                'All CardLink data cleared'
            )
          }
        />
        <ActionRow
          title="Clear User Data"
          disabled={isLoading}
          onPress={() =>
            withLoading(
              () => cardLinkModule.deleteAllUserRelatedData(),
              'User data deleted'
            )
          }
        />
      </Section>

      <Section title="Result">
        {isLoading ? (
          <CardBlock>
            <ActivityIndicator color={colors.accent} />
          </CardBlock>
        ) : result ? (
          <CardBlock>
            <Text style={styles.result} selectable>
              {result}
            </Text>
          </CardBlock>
        ) : (
          <Hint>No result yet</Hint>
        )}
      </Section>

      <Section
        title="CardLink Events"
        right={
          <LinkButton
            title="Clear all events"
            onPress={() => eventLog.clear()}
          />
        }
      >
        <EventList
          entries={cardLinkEvents.slice(0, 50)}
          emptyText="No CardLink events yet"
        />
      </Section>
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing.md,
  },
  launchButtons: {
    flexDirection: 'row',
  },
  flexButton: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  result: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 17,
    color: colors.ink,
  },
});
