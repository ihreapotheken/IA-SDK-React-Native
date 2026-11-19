import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Tappable } from './Tappable';
import { colors, radius, spacing, type } from './theme';

/** A small selectable pill; a busy one shows a spinner and looks selected. */
export function Chip({
  label,
  isSelected,
  onPress,
  disabled,
  isBusy,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
  isBusy?: boolean;
}) {
  const isHighlighted = isSelected || isBusy;
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      isBusy={isBusy}
      style={[styles.chip, isHighlighted && styles.chipSelected]}
      accessibilityLabel={label}
    >
      {isBusy ? (
        <ActivityIndicator size="small" color={colors.accentOnSoft} />
      ) : null}
      <Text style={[styles.text, isHighlighted && styles.textSelected]}>
        {label}
      </Text>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 36,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.surfaceSunken,
  },
  chipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  text: {
    ...type.caption,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  textSelected: {
    color: colors.accentOnSoft,
  },
});
