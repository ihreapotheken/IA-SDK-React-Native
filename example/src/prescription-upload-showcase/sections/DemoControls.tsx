import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { copy } from '../copy';
import { DEMO_PHARMACY_IDS } from '../sdk/showcaseSdk';
import type { ActionProps } from '../state/useActionRunner';
import {
  Button,
  ChevronIcon,
  Chip,
  colors,
  radius,
  shared,
  spacing,
  Tappable,
} from '../../ui';

/** For the presenter, folded away: switch the test pharmacy, or reset the demo. */
export function DemoControls({
  pharmacyId,
  selectPharmacy,
  clearCart,
  clearPharmacy,
  reset,
}: {
  pharmacyId: string | null;
  selectPharmacy: (id: string) => ActionProps;
  clearCart: ActionProps;
  clearPharmacy: ActionProps;
  reset: ActionProps;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.controls}>
      <Tappable
        onPress={() => setIsOpen((open) => !open)}
        style={styles.header}
        testID="showcase-controls"
      >
        <View style={shared.textStack}>
          <Text style={shared.title}>{copy.controlsSection}</Text>
          <Text style={shared.subtitle}>{copy.controlsHint}</Text>
        </View>
        <View style={isOpen && styles.chevronOpen}>
          <ChevronIcon color={colors.inkSecondary} />
        </View>
      </Tappable>
      {isOpen && (
        <View style={styles.body}>
          <Text style={shared.label}>{copy.controlsPharmacy}</Text>
          <View style={shared.row}>
            {DEMO_PHARMACY_IDS.map((id) => (
              <Chip
                key={id}
                {...selectPharmacy(id)}
                label={id}
                isSelected={pharmacyId === id}
              />
            ))}
          </View>
          <View style={shared.row}>
            <Button
              {...clearCart}
              title={copy.controlsClearCart}
              variant="secondary"
              style={styles.flexButton}
            />
            <Button
              {...clearPharmacy}
              title={copy.controlsClearPharmacy}
              variant="secondary"
              style={styles.flexButton}
            />
          </View>
          <Button {...reset} title={copy.controlsReset} variant="danger" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    marginTop: spacing.xxl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  flexButton: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
