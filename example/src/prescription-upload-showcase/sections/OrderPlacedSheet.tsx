import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { copy } from '../copy';
import type { PlacedOrder } from '../sdk/showcaseSdk';
import { Button, CheckIcon, colors, radius, spacing, type } from '../../ui';

/**
 * Tells that an order was placed and shows its codes: the ia.de order code
 * from the SDK and the app's own order ID, like the NativeScript demo's order
 * codes alert.
 */
export function OrderPlacedSheet({
  order,
  bottomInset,
  onDismiss,
}: {
  order: PlacedOrder;
  bottomInset: number;
  onDismiss: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const translateY = useMemo(
    () => progress.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }),
    [progress]
  );

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onDismiss();
        return true;
      }
    );
    return () => subscription.remove();
  }, [onDismiss, progress]);

  const rows = [
    { label: copy.orderCodeIa, values: order.iaOrderCodes },
    { label: copy.orderIdHost, values: order.hostOrderIds },
  ].filter((row) => row.values.length > 0);

  return (
    <View style={StyleSheet.absoluteFill} testID="showcase-order-sheet">
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityLabel={copy.done}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: bottomInset + spacing.xl,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.check}>
          <CheckIcon color={colors.white} />
        </View>
        <Text style={styles.title}>{copy.orderPlaced}</Text>
        <Text style={styles.body}>{copy.orderPlacedBody}</Text>
        <View style={styles.codes}>
          {rows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.codeRow, index > 0 && styles.codeRowDivider]}
            >
              <Text style={styles.codeLabel}>{row.label}</Text>
              <Text style={styles.codeValue} selectable>
                {row.values.join(', ')}
              </Text>
            </View>
          ))}
        </View>
        <Button
          title={copy.done}
          onPress={onDismiss}
          testID="showcase-order-done"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 24, 29, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xl,
  },
  check: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...type.title,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    ...type.body,
    color: colors.inkSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  codes: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  codeRow: {
    paddingVertical: spacing.md,
    gap: 2,
  },
  codeRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  codeLabel: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  codeValue: {
    ...type.headline,
    color: colors.ink,
    letterSpacing: 0.3,
  },
});
