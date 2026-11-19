import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ChevronIcon } from './icons';
import { Tappable } from './Tappable';
import { colors, radius, shared, spacing } from './theme';

/** A rounded square holding an icon, red or, for something not set yet, grey. */
export function IconTile({
  children,
  tone = 'accent',
}: {
  children: ReactNode;
  tone?: 'accent' | 'neutral';
}) {
  return (
    <View
      style={[styles.iconTile, tone === 'neutral' && styles.iconTileNeutral]}
    >
      {children}
    </View>
  );
}

/** A list row opening a feature: icon, title, description and a chevron. */
export function FeatureRow({
  icon,
  title,
  body,
  onPress,
  disabled,
  isBusy,
  testID,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  onPress: () => void;
  disabled?: boolean;
  isBusy?: boolean;
  testID?: string;
}) {
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      isBusy={isBusy}
      style={styles.row}
      accessibilityLabel={`${title}. ${body}`}
      testID={testID}
    >
      <IconTile>{icon}</IconTile>
      <View style={shared.textStack}>
        <Text style={shared.title}>{title}</Text>
        <Text style={shared.subtitle}>{body}</Text>
      </View>
      <View style={styles.trailing}>
        {isBusy ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <ChevronIcon color={colors.inkTertiary} />
        )}
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileNeutral: {
    backgroundColor: colors.surfaceSunken,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  trailing: {
    width: 24,
    alignItems: 'center',
  },
});
