import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, type } from './theme';

export interface ToastMessage {
  text: string;
  /** Tells a repeated text apart, so it shows again. */
  id: number;
}

/** A message that slides in at the bottom, hides itself and then reports it. */
export function Toast({
  message,
  bottom,
  onHidden,
}: {
  message: ToastMessage;
  bottom: number;
  onHidden: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const translateY = useMemo(
    () => progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
    [progress]
  );

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => finished && onHidden());
    return () => animation.stop();
  }, [message, onHidden, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { bottom, opacity: progress, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.text}>{message.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    maxWidth: '88%',
  },
  text: {
    ...type.caption,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
});
