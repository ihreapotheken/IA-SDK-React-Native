import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Tappable } from './Tappable';
import { colors, radius, spacing, type } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'inverse' | 'danger';

const textColors: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.ink,
  inverse: colors.accent,
  danger: colors.accentOnSoft,
};

/** A pill button; a busy one shows a spinner instead of its trailing icon. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  isBusy,
  trailing,
  style,
  testID,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  isBusy?: boolean;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const textColor = textColors[variant];
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      isBusy={isBusy}
      style={[styles.button, variants[variant], style]}
      accessibilityLabel={title}
      testID={testID}
    >
      {isBusy ? <ActivityIndicator color={textColor} /> : null}
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
        {title}
      </Text>
      {!isBusy && trailing}
    </Tappable>
  );
}

const variants = StyleSheet.create({
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceSunken },
  inverse: { backgroundColor: colors.white },
  danger: { backgroundColor: colors.accentSoft },
});

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    ...type.headline,
  },
});
