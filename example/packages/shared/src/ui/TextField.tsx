import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, radius, shared, spacing, type } from './theme';

/** A labelled text input. */
export function TextField({
  label,
  ...inputProps
}: { label?: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={shared.subtitle}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.inkTertiary}
        {...inputProps}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  input: {
    ...type.body,
    color: colors.ink,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
});
