import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * A pressable that dims while pressed. A disabled one is dimmed; a busy one,
 * whose action runs, takes no taps either but stays opaque to show its
 * progress.
 */
export function Tappable({
  onPress,
  disabled,
  isBusy,
  style,
  children,
  accessibilityLabel,
  testID,
}: {
  onPress: () => void;
  disabled?: boolean;
  isBusy?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isBusy}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, busy: !!isBusy }}
      testID={testID}
      style={({ pressed }) => [
        style,
        pressed && styles.pressed,
        disabled && !isBusy && styles.disabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
