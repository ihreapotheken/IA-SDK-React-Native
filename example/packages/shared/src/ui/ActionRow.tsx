import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { ChevronIcon } from './icons';
import { blockDivider } from './Section';
import { Tappable } from './Tappable';
import { colors, radius, shared, spacing, type } from './theme';

type OnlyOn = 'ios' | 'android';

const platformNames: Record<OnlyOn, string> = {
  ios: 'iOS',
  android: 'Android',
};

/** Marks a row whose API exists on one platform only. */
function PlatformBadge({ platform }: { platform: OnlyOn }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{platformNames[platform]}</Text>
    </View>
  );
}

function RowText({
  title,
  description,
  platform,
}: {
  title: string;
  description?: string;
  platform?: OnlyOn;
}) {
  return (
    <View style={shared.textStack}>
      <View style={styles.titleLine}>
        <Text style={styles.title}>{title}</Text>
        {platform ? <PlatformBadge platform={platform} /> : null}
      </View>
      {description ? <Text style={shared.subtitle}>{description}</Text> : null}
    </View>
  );
}

/**
 * A row in a section that runs an action. While the promise `onPress` returns
 * is pending, the row shows a spinner and takes no taps. A row for one
 * platform only shows its badge there and isn't shown on the other.
 */
export function ActionRow({
  title,
  description,
  onPress,
  disabled = false,
  platform,
}: {
  title: string;
  description?: string;
  /** Returns a promise to show progress until it settles. */
  onPress: () => unknown;
  disabled?: boolean;
  platform?: OnlyOn;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  if (platform && Platform.OS !== platform) {
    return null;
  }

  const handlePress = () => {
    const result = onPress();
    if (result instanceof Promise) {
      setIsBusy(true);
      result.finally(() => isMounted.current && setIsBusy(false));
    }
  };

  // UI tests find rows by this label, with the platform as the old title suffix.
  const label = `${title}${platform ? ` (${platformNames[platform]})` : ''}`;
  return (
    <Tappable
      onPress={handlePress}
      disabled={disabled}
      isBusy={isBusy}
      style={styles.row}
      accessibilityLabel={description ? `${label}, ${description}` : label}
    >
      <RowText title={title} description={description} platform={platform} />
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

/** A row in a section with a switch. */
export function SwitchRow({
  title,
  description,
  value,
  onValueChange,
  platform,
}: {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  platform?: OnlyOn;
}) {
  if (platform && Platform.OS !== platform) {
    return null;
  }
  return (
    <View style={styles.row}>
      <RowText title={title} description={description} platform={platform} />
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: colors.switchOff }}
        thumbColor={Platform.OS === 'android' ? colors.white : undefined}
        ios_backgroundColor={colors.switchOff}
        accessibilityLabel={title}
        // UI tests select switches by it, e.g. `switch-custom-ui-colors`.
        testID={`switch-${title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...blockDivider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    ...type.headline,
    fontSize: 15,
    color: colors.ink,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.inkSecondary,
  },
  trailing: {
    width: 24,
    alignItems: 'center',
  },
});
