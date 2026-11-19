import { Platform, StyleSheet, Text, View } from 'react-native';
import { IaSdkInitializationState } from '@ihreapotheken/ia-sdk-core';
import {
  ANDROID_APPSDK_VERSION,
  IOS_APPSDK_VERSION,
  SERVER_ENVIRONMENT,
  SERVER_ENVIRONMENT_LABEL,
} from '../../generatedEnvConfig';
import { colors, radius, spacing, type } from '../../ui';

const platformLine = `React Native · ${Platform.OS === 'ios' ? 'iOS' : 'Android'} AppSDK ${
  Platform.OS === 'ios' ? IOS_APPSDK_VERSION : ANDROID_APPSDK_VERSION
} · ${SERVER_ENVIRONMENT_LABEL} (${SERVER_ENVIRONMENT})`;

const stateLabels: Record<IaSdkInitializationState, string> = {
  [IaSdkInitializationState.Uninitialized]: 'Not initialized',
  [IaSdkInitializationState.Initializing]: 'Initializing',
  [IaSdkInitializationState.Initialized]: 'Initialized',
  [IaSdkInitializationState.Error]: 'Error',
};

/** The brand, the SDK version and backend, and the SDK's initialization state. */
export function DemoHeader({
  initState,
  isRegistered,
  topInset,
}: {
  initState: IaSdkInitializationState;
  isRegistered: boolean;
  topInset: number;
}) {
  const isReady = initState === IaSdkInitializationState.Initialized;
  return (
    <View style={[styles.header, { paddingTop: topInset + spacing.md }]}>
      <View style={styles.titleRow}>
        <View style={styles.brand}>
          <Text style={styles.brandMark}>ia.de</Text>
          <Text style={styles.brandProduct}>AppSDK Demo</Text>
        </View>
        <View style={[styles.state, isReady && styles.stateReady]}>
          <View style={[styles.stateDot, isReady && styles.stateDotReady]} />
          <Text style={[styles.stateText, isReady && styles.stateTextReady]}>
            {isRegistered ? stateLabels[initState] : 'Registering'}
          </Text>
        </View>
      </View>
      <Text style={styles.platform}>{platformLine}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  brandMark: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.accent,
  },
  brandProduct: {
    ...type.headline,
    color: colors.inkSecondary,
  },
  platform: {
    ...type.caption,
    color: colors.inkTertiary,
  },
  state: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
  },
  stateReady: {
    backgroundColor: '#E5F4EC',
  },
  stateDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.inkTertiary,
  },
  stateDotReady: {
    backgroundColor: colors.success,
  },
  stateText: {
    ...type.caption,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  stateTextReady: {
    color: colors.success,
  },
});
