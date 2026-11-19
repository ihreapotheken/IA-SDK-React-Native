import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { copy } from '../copy';
import type { ActionProps } from '../state/useActionRunner';
import { BagIcon, colors, spacing, Tappable, type } from '../../ui';

/** The brand and the cart button, with the number of items in the cart. */
export function Header({
  cartCount,
  cart,
}: {
  cartCount: number | null;
  cart: ActionProps;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Text style={styles.brandMark}>{copy.brand}</Text>
        <Text style={styles.brandProduct}>{copy.brandProduct}</Text>
      </View>
      <Tappable
        {...cart}
        style={styles.cartButton}
        accessibilityLabel={`${copy.cartTitle}${cartCount ? `, ${copy.cartItems(cartCount)}` : ''}`}
        testID="showcase-cart"
      >
        {cart.isBusy ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <BagIcon color={colors.ink} />
        )}
        {!!cartCount && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {cartCount > 99 ? '99+' : cartCount}
            </Text>
          </View>
        )}
      </Tappable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  brandMark: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.accent,
  },
  brandProduct: {
    ...type.headline,
    color: colors.inkSecondary,
  },
  cartButton: {
    width: 48,
    height: 48,
    // Exactly half the size: Android draws a larger radius as a square while dimmed.
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
});
