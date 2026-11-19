import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ServerEnvironment } from '@ihreapotheken/ia-sdk-core';
import { serverEnvironment } from '../../sdkConfig';
import { copy } from '../copy';
import type { ActionProps } from '../state/useActionRunner';
import type { Connection } from '../state/useShowcaseSdk';
import { Button, ChevronIcon, colors, radius, spacing, type } from '../../ui';

/** The QA backend is only reachable over VPN, a likely cause of trouble connecting. */
const vpnHint =
  serverEnvironment === ServerEnvironment.Staging ? ` ${copy.vpnHint}` : '';

/**
 * The pitch and the main action, transferring prescriptions, or the progress
 * or failure of connecting to the SDK until it's ready.
 */
export function Hero({
  connection,
  transfer,
  onRetry,
}: {
  connection: Connection;
  transfer: ActionProps;
  onRetry: () => void;
}) {
  return (
    <View style={styles.hero}>
      <View style={[styles.circle, styles.circleLarge]} />
      <View style={[styles.circle, styles.circleSmall]} />
      <Text style={styles.eyebrow}>{copy.heroEyebrow}</Text>
      <Text style={styles.title}>{copy.heroTitle}</Text>
      <Text style={styles.body}>{copy.heroBody}</Text>

      {connection.status === 'ready' && (
        <>
          <Button
            {...transfer}
            title={copy.transferAction}
            variant="inverse"
            trailing={<ChevronIcon color={colors.accent} />}
            style={styles.button}
            testID="showcase-transfer"
          />
          <Text style={styles.caption}>{copy.transferCaption}</Text>
        </>
      )}
      {connection.status === 'connecting' && (
        <View style={styles.status}>
          <ActivityIndicator color={colors.white} />
          <Text style={styles.statusText}>
            {connection.isSlow
              ? `${copy.connectingSlow}${vpnHint}`
              : copy.connecting}
          </Text>
        </View>
      )}
      {connection.status === 'failed' && (
        <View style={styles.failure}>
          <Text style={styles.statusTitle}>{copy.connectFailed}</Text>
          <Text style={styles.statusText}>
            {copy.connectFailedBody}
            {vpnHint}
          </Text>
          {/* The SDK's own message, for the presenter. */}
          <Text style={styles.errorDetail} numberOfLines={3}>
            {connection.message}
          </Text>
          <Button
            title={copy.retry}
            variant="inverse"
            onPress={onRetry}
            style={styles.button}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  circleLarge: {
    width: 260,
    height: 260,
    top: -120,
    right: -90,
  },
  circleSmall: {
    width: 140,
    height: 140,
    bottom: -60,
    right: 40,
  },
  eyebrow: {
    ...type.overline,
    color: colors.whiteMuted,
    marginBottom: spacing.sm,
  },
  title: {
    ...type.display,
    color: colors.white,
    marginBottom: spacing.md,
  },
  body: {
    ...type.body,
    color: colors.whiteMuted,
  },
  button: {
    marginTop: spacing.xl,
    alignSelf: 'flex-start',
  },
  caption: {
    ...type.caption,
    color: colors.whiteMuted,
    marginTop: spacing.md,
  },
  status: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
  },
  failure: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  statusTitle: {
    ...type.headline,
    color: colors.white,
  },
  statusText: {
    ...type.caption,
    color: colors.whiteMuted,
    flexShrink: 1,
  },
  errorDetail: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: spacing.xs,
  },
});
