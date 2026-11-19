import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { iaSdk } from '@ihreapotheken/ia-sdk-core';
import {
  ANDROID_APPSDK_VERSION,
  IOS_APPSDK_VERSION,
  SERVER_ENVIRONMENT_LABEL,
  colors,
  spacing,
  Toast,
  type,
  type ToastMessage,
} from '@ia-example/shared';
import { copy } from './copy';
import { ordering, pharmacy, prescription } from './sdk/showcaseSdk';
import { DemoControls } from './sections/DemoControls';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { MoreFromSdk } from './sections/MoreFromSdk';
import { OrderPlacedSheet } from './sections/OrderPlacedSheet';
import { PharmacySection } from './sections/PharmacySection';
import { useActionRunner } from './state/useActionRunner';
import { useShowcaseSdk } from './state/useShowcaseSdk';

const sdkVersion =
  Platform.OS === 'ios' ? IOS_APPSDK_VERSION : ANDROID_APPSDK_VERSION;

/** The showcase's only screen: each section opens part of the SDK. */
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const sdk = useShowcaseSdk();
  const action = useActionRunner(sdk.isReady);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = (text: string) => setToast({ text, id: Date.now() });
  const hideToast = useCallback(() => setToast(null), []);

  const reset = action(copy.controlsReset, sdk.logout, {
    onSuccess: () => showToast(copy.toastReset),
  });

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
      >
        <Header
          cartCount={sdk.cartCount}
          cart={action(copy.cartTitle, () => ordering().launchCartScreen())}
        />
        <Hero
          connection={sdk.connection}
          transfer={action(copy.transferAction, sdk.transfer)}
          onRetry={sdk.retry}
        />
        <MoreFromSdk
          scan={action(copy.scanTitle, () =>
            prescription().launchRedeemPrescriptionScreen()
          )}
          dashboard={action(copy.dashboardTitle, () =>
            iaSdk.startDashboardActivity()
          )}
        />
        <PharmacySection
          state={sdk.pharmacy}
          showDetails={action(copy.pharmacyDetails, () =>
            pharmacy().launchPharmacyDetails()
          )}
          change={action(copy.pharmacyChange, () =>
            iaSdk.launchApofinder({ isCancellable: true })
          )}
        />
        <DemoControls
          pharmacyId={sdk.pharmacy.id}
          selectPharmacy={(id) =>
            action(copy.controlsPharmacy, () => sdk.selectPharmacy(id), {
              key: `pharmacy-${id}`,
              onSuccess: () => showToast(copy.toastPharmacySet(id)),
            })
          }
          clearCart={action(copy.controlsClearCart, sdk.clearCart, {
            onSuccess: () => showToast(copy.toastCartCleared),
          })}
          clearPharmacy={action(copy.controlsClearPharmacy, sdk.clearPharmacy, {
            onSuccess: () => showToast(copy.toastPharmacyCleared),
          })}
          reset={{
            ...reset,
            onPress: () =>
              Alert.alert(copy.controlsReset, copy.controlsResetBody, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: copy.controlsReset,
                  style: 'destructive',
                  onPress: reset.onPress,
                },
              ]),
          }}
        />
        <Text style={styles.meta}>
          React Native · {Platform.OS === 'ios' ? 'iOS' : 'Android'} AppSDK{' '}
          {sdkVersion} · {SERVER_ENVIRONMENT_LABEL}
        </Text>
      </ScrollView>

      {/* Keeps scrolled content from running under the status bar. */}
      <View
        pointerEvents="none"
        style={[styles.statusBarBackdrop, { height: insets.top }]}
      />
      {toast && (
        <Toast
          message={toast}
          bottom={insets.bottom + spacing.xl}
          onHidden={hideToast}
        />
      )}
      {sdk.placedOrder && (
        <OrderPlacedSheet
          order={sdk.placedOrder}
          bottomInset={insets.bottom}
          onDismiss={sdk.dismissOrder}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    opacity: 0.96,
  },
  meta: {
    ...type.caption,
    color: colors.inkTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
