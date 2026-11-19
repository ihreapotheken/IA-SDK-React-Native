import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, Tappable, type } from '../../ui';

/** The demo's tabs, one per area of the SDK. */
export function TabBar<T extends string>({
  tabs,
  active,
  onSelect,
  bottomInset,
}: {
  tabs: readonly { name: T; label: string }[];
  active: T;
  onSelect: (tab: T) => void;
  bottomInset: number;
}) {
  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(bottomInset, spacing.md) }]}
    >
      {tabs.map((tab) => {
        const isActive = tab.name === active;
        return (
          <Tappable
            key={tab.name}
            onPress={() => onSelect(tab.name)}
            style={styles.tab}
            accessibilityLabel={tab.label}
            // UI tests select tabs by it; "Home" alone also matches the system navigation bar.
            testID={`tab-${tab.name}`}
          >
            <View
              style={[styles.indicator, isActive && styles.indicatorActive]}
            />
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Tappable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  indicator: {
    alignSelf: 'stretch',
    marginHorizontal: spacing.md,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  indicatorActive: {
    backgroundColor: colors.accent,
  },
  label: {
    ...type.caption,
    fontSize: 12,
    color: colors.inkSecondary,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
});
