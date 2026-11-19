import { StyleSheet, View } from 'react-native';
import { Chip } from './Chip';
import { spacing } from './theme';

/** A choice of one option, as chips that wrap. */
export function ChoiceChips<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          isSelected={selected === option.value}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
