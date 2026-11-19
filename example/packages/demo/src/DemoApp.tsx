import { useCallback, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { APPSDK_ACCESS_KEY } from '@env';
import { colors } from '@ia-example/shared';
import { DemoHeader } from './components/DemoHeader';
import {
  EmbeddedScreen,
  type EmbeddedScreenRequest,
} from './components/EmbeddedScreen';
import { TabBar } from './components/TabBar';
import { DEFAULT_INIT_OPTIONS, type InitOptions } from './sdk/initConfig';
import { useDemoSdk } from './sdk/useDemoSdk';
import { CardLinkTab } from './tabs/CardLinkTab';
import { EventsTab } from './tabs/EventsTab';
import { HomeTab } from './tabs/HomeTab';
import { ScreensTab } from './tabs/ScreensTab';
import { ServicesTab } from './tabs/ServicesTab';
import { ViewsTab } from './tabs/ViewsTab';

if (!APPSDK_ACCESS_KEY) {
  throw new Error(
    'APPSDK_ACCESS_KEY is missing. Please add it to your .secrets file.'
  );
}

const TABS = [
  { name: 'home', label: 'Home' },
  { name: 'screens', label: 'Screens' },
  { name: 'services', label: 'Services' },
  { name: 'components', label: 'Views' },
  { name: 'cardlink', label: 'CardLink' },
  { name: 'events', label: 'Events' },
] as const;

type TabName = (typeof TABS)[number]['name'];

/** The demo: every module and API of the SDK, with test tools, in tabs. */
function Demo() {
  const insets = useSafeAreaInsets();
  const sdk = useDemoSdk();
  const [activeTab, setActiveTab] = useState<TabName>('home');
  // Kept here, so they survive switching tabs.
  const [initOptions, setInitOptions] =
    useState<InitOptions>(DEFAULT_INIT_OPTIONS);
  const [embeddedScreen, setEmbeddedScreen] =
    useState<EmbeddedScreenRequest | null>(null);
  const closeEmbeddedScreen = useCallback(() => setEmbeddedScreen(null), []);

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            options={initOptions}
            onOptionsChange={setInitOptions}
            isRegistered={sdk.isRegistered}
            isInitialized={sdk.isInitialized}
            initState={sdk.initState}
            onInitialize={sdk.initialize}
          />
        );
      case 'screens':
        return (
          <ScreensTab
            isInitialized={sdk.isInitialized}
            onEmbedScreen={setEmbeddedScreen}
          />
        );
      case 'services':
        return <ServicesTab isInitialized={sdk.isInitialized} />;
      case 'components':
        return <ViewsTab />;
      case 'cardlink':
        return sdk.cardLinkModule ? (
          <CardLinkTab cardLinkModule={sdk.cardLinkModule} />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        );
      case 'events':
        return <EventsTab />;
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <DemoHeader
        initState={sdk.initState}
        isRegistered={sdk.isRegistered}
        topInset={insets.top}
      />
      <View style={styles.content}>{renderTab()}</View>
      <TabBar
        tabs={TABS}
        active={activeTab}
        onSelect={setActiveTab}
        bottomInset={insets.bottom}
      />
      {embeddedScreen && (
        <EmbeddedScreen
          request={embeddedScreen}
          onClose={closeEmbeddedScreen}
        />
      )}
    </View>
  );
}

export default function DemoApp() {
  return (
    <SafeAreaProvider>
      <Demo />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
