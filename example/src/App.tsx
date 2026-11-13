import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { APPSDK_ACCESS_KEY } from '@env';
import {
  ANDROID_APPSDK_VERSION,
  IOS_APPSDK_VERSION,
  SERVER_ENVIRONMENT,
  SERVER_ENVIRONMENT_LABEL,
} from './generatedEnvConfig';
import {
  iaSdk,
  IaHeaderStyle,
  IaSdkInitializationState,
  ServerEnvironment,
  type InitConfig,
} from '@ihreapotheken/ia-sdk-core';
import { IaModuleOrdering } from '@ihreapotheken/ia-sdk-ordering';
import { IaModuleOverTheCounter } from '@ihreapotheken/ia-sdk-over-the-counter';
import { IaModulePharmacy } from '@ihreapotheken/ia-sdk-pharmacy';
import { IaModulePrescription } from '@ihreapotheken/ia-sdk-prescription';
import { IaModuleCardLink } from '@ihreapotheken/ia-sdk-cardlink';
import {
  CardLinkView,
  ComponentsView,
  EmbeddedScreen,
  EventsView,
  ScreensView,
  ServicesView,
  setInitialMascotVisibility,
  type EmbeddedScreenRequest,
} from './views';
import { ActionButton, runAction, Section, SwitchRow, styles as ui } from './views/ui';
import { attachSdkListeners } from './testing/sdkListeners';
import { installHostCallbacks } from './testing/testSettings';
import { eventLog } from './testing/eventLog';

if (!APPSDK_ACCESS_KEY) {
  throw new Error('APPSDK_ACCESS_KEY is missing. Please add it to your .secrets file.');
}

type TabName = 'home' | 'screens' | 'services' | 'components' | 'cardlink' | 'events';

const TABS: { name: TabName; label: string }[] = [
  { name: 'home', label: 'Home' },
  { name: 'screens', label: 'Screens' },
  { name: 'services', label: 'Services' },
  { name: 'components', label: 'Views' },
  { name: 'cardlink', label: 'CardLink' },
  { name: 'events', label: 'Events' },
];

// Server environment the SDK is initialized with, taken from the monorepo .env
// so the app name (DEV/QA/PROD suffix) and the SDK config can never disagree.
const serverEnvironment =
  (Object.values(ServerEnvironment) as string[]).includes(SERVER_ENVIRONMENT)
    ? (SERVER_ENVIRONMENT as ServerEnvironment)
    : ServerEnvironment.Staging;

/** Initialization options the Home tab switches, to test the configuration. */
interface InitOptions {
  shouldFetchThemeFromRemote: boolean;
  isImprintHandledByHostApp: boolean;
  runOnboardingIfNeeded: boolean;
  showTestPharmaciesInApofinder: boolean;
  customUiColors: boolean;
  hideMascotIllustrations: boolean;
  cardLinkSaveCardEnabled: boolean;
}

function buildInitConfig(options: InitOptions): InitConfig {
  return {
    accessKey: APPSDK_ACCESS_KEY as string,
    clientId: '6001',
    serverEnvironment,
    shouldFetchThemeFromRemote: options.shouldFetchThemeFromRemote,
    footer: { isImprintHandledByHostApp: options.isImprintHandledByHostApp },
    initialization: {
      prerequisites: { runOnboardingIfNeeded: options.runOnboardingIfNeeded },
    },
    uiConfiguration: {
      shouldShowMascotIllustrations: !options.hideMascotIllustrations,
      ...(options.customUiColors
        ? {
            header: {
              style: IaHeaderStyle.Monotone,
              primaryColor: 0xff6a1b9a,
              secondaryColor: 0xffce93d8,
            },
            primaryButton: {
              backgroundColor: 0xff6a1b9a,
              textColor: 0xffffffff,
              borderRadius: 24,
            },
            secondaryButton: {
              borderColor: 0xff6a1b9a,
              textColor: 0xff6a1b9a,
              borderWidth: 2,
              borderRadius: 24,
            },
          }
        : {}),
    },
    qaConfiguration: options.showTestPharmaciesInApofinder
      ? { showTestPharmaciesInApofinder: true }
      : undefined,
    cardLink: { isSaveCardEnabled: options.cardLinkSaveCardEnabled },
  };
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [isRegistered, setIsRegistered] = useState(false);
  const [didInitialize, setDidInitialize] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardLinkModule, setCardLinkModule] = useState<IaModuleCardLink | null>(null);
  const [initState, setInitState] = useState<IaSdkInitializationState>(
    IaSdkInitializationState.Uninitialized
  );
  // The SDK's own state too, so a remounted app (e.g. after Fast Refresh) keeps
  // its buttons enabled.
  const isInitialized =
    didInitialize || initState === IaSdkInitializationState.Initialized;
  const [embeddedScreen, setEmbeddedScreen] = useState<EmbeddedScreenRequest | null>(null);
  const closeEmbeddedScreen = useCallback(() => setEmbeddedScreen(null), []);
  const [initOptions, setInitOptions] = useState<InitOptions>({
    shouldFetchThemeFromRemote: false,
    isImprintHandledByHostApp: false,
    runOnboardingIfNeeded: false,
    showTestPharmaciesInApofinder: false,
    customUiColors: false,
    hideMascotIllustrations: false,
    cardLinkSaveCardEnabled: true,
  });

  // Register modules on mount
  useEffect(() => {
    const subscription = iaSdk.addInitializationStateListener(setInitState);
    iaSdk.getInitializationState().then(setInitState).catch(() => undefined);

    const registerModules = async () => {
      try {
        const cardLink = new IaModuleCardLink();
        await iaSdk.register([
          new IaModuleOrdering(),
          new IaModuleOverTheCounter(),
          new IaModulePharmacy(),
          new IaModulePrescription(),
          cardLink,
        ]);
        attachSdkListeners();
        installHostCallbacks();
        setCardLinkModule(cardLink);
        setIsRegistered(true);
        eventLog.add('App', 'Modules registered');
      } catch (e) {
        console.error('Module registration error:', e);
        eventLog.add('App', `Module registration failed: ${String(e)}`);
      }
    };
    registerModules();
    return () => subscription.remove();
  }, []);

  const handleInitialize = useCallback(async () => {
    setIsLoading(true);
    try {
      await iaSdk.initialize(buildInitConfig(initOptions));
      setInitialMascotVisibility(!initOptions.hideMascotIllustrations);
      setDidInitialize(true);
      eventLog.add('App', 'SDK initialized');
    } catch (e) {
      await runAction('Initialize', () => Promise.reject(e));
    } finally {
      setIsLoading(false);
    }
  }, [initOptions]);

  const setInitOption = (key: keyof InitOptions) => (value: boolean) =>
    setInitOptions((previous) => ({ ...previous, [key]: value }));

  const renderHomeTab = () => (
    <ScrollView contentContainerStyle={ui.scrollContent}>
      <Text style={styles.title}>IA SDK React Native Example</Text>
      <Text style={styles.subtitle}>
        {Platform.OS === 'ios' ? 'iOS' : 'Android'}{' '}
        {Platform.OS === 'ios' ? IOS_APPSDK_VERSION : ANDROID_APPSDK_VERSION}
        {' · '}
        {SERVER_ENVIRONMENT_LABEL} ({SERVER_ENVIRONMENT})
      </Text>
      <Text style={styles.status}>
        Modules: {isRegistered ? 'Registered' : 'Not Registered'} · State:{' '}
        {initState}
      </Text>

      <Section title="Initialization">
        <Text style={ui.hint}>
          Options apply to the first successful initialize call.
        </Text>
        <SwitchRow
          title="Fetch theme from remote"
          value={initOptions.shouldFetchThemeFromRemote}
          onValueChange={setInitOption('shouldFetchThemeFromRemote')}
        />
        <SwitchRow
          title="Host handles imprint"
          description="The imprint button reports the imprint navigation target"
          value={initOptions.isImprintHandledByHostApp}
          onValueChange={setInitOption('isImprintHandledByHostApp')}
        />
        <SwitchRow
          title="Run onboarding in prerequisites"
          value={initOptions.runOnboardingIfNeeded}
          onValueChange={setInitOption('runOnboardingIfNeeded')}
        />
        <SwitchRow
          title="Show test pharmacies in Apofinder (QA)"
          value={initOptions.showTestPharmaciesInApofinder}
          onValueChange={setInitOption('showTestPharmaciesInApofinder')}
        />
        <SwitchRow
          title="Custom UI colors"
          description="Purple monotone header and rounded buttons"
          value={initOptions.customUiColors}
          onValueChange={setInitOption('customUiColors')}
        />
        <SwitchRow
          title="Hide mascot illustrations"
          value={initOptions.hideMascotIllustrations}
          onValueChange={setInitOption('hideMascotIllustrations')}
        />
        <SwitchRow
          title="CardLink saves cards (SDK-started flows)"
          value={initOptions.cardLinkSaveCardEnabled}
          onValueChange={setInitOption('cardLinkSaveCardEnabled')}
        />
        <ActionButton
          title={`Initialize (${isRegistered ? 'Ready' : 'Wait'})`}
          onPress={handleInitialize}
          // cleanCache(initialization) uninitializes the SDK, so it can be initialized again.
          disabled={
            !isRegistered ||
            isLoading ||
            (isInitialized && initState === IaSdkInitializationState.Initialized)
          }
        />
      </Section>

      <Section title="State">
        <ActionButton
          title="Is Initialized"
          onPress={() => runAction('Is Initialized', () => iaSdk.isInitialized(), String)}
        />
        <ActionButton
          title="Get Initialization State"
          onPress={() => runAction('Initialization State', () => iaSdk.getInitializationState())}
        />
        <ActionButton
          title="Get Environment"
          onPress={() => runAction('Environment', () => iaSdk.getEnvironment())}
        />
      </Section>

      <Section title="Prerequisites">
        <ActionButton
          title="Launch Prerequisite Flow"
          description="Legal documents, onboarding and pharmacy selection"
          disabled={!isInitialized}
          onPress={() =>
            runAction('Prerequisite Flow', () => iaSdk.launchPrerequisiteFlow(), (result) =>
              result.isCancelled ? 'Cancelled' : 'Completed'
            )
          }
        />
        <ActionButton
          title="Is Prerequisite Flow Completed"
          disabled={!isInitialized}
          onPress={() =>
            runAction('Prerequisite Flow Completed', () => iaSdk.isPrerequisiteFlowCompleted(), String)
          }
        />
      </Section>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'screens' && (
          <ScreensView isInitialized={isInitialized} onEmbedScreen={setEmbeddedScreen} />
        )}
        {activeTab === 'services' && <ServicesView isInitialized={isInitialized} />}
        {activeTab === 'components' && <ComponentsView />}
        {activeTab === 'cardlink' && renderCardLinkTab()}
        {activeTab === 'events' && <EventsView />}
      </View>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            // UI tests select tabs by it; "Home" alone also matches the system navigation bar.
            testID={`tab-${tab.name}`}
            style={[styles.tab, activeTab === tab.name && styles.tabActive]}
            onPress={() => setActiveTab(tab.name)}
          >
            <Text
              style={[styles.tabText, activeTab === tab.name && styles.tabTextActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {embeddedScreen && (
        <EmbeddedScreen request={embeddedScreen} onClose={closeEmbeddedScreen} />
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  status: {
    fontSize: 12,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
    fontSize: 12,
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
