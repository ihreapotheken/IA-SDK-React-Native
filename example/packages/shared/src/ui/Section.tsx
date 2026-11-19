import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Card, SectionTitle } from './Card';
import { Tappable } from './Tappable';
import { colors, radius, spacing, type } from './theme';

/**
 * A titled card of rows and blocks. Each child draws a hairline above itself,
 * and the card hides the first one, so any mix of rows reads as one list.
 */
export function Section({
  title,
  right,
  children,
}: {
  title: string;
  /** Beside the title, e.g. a `LinkButton`. */
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View>
      <View style={styles.header}>
        <SectionTitle>{title}</SectionTitle>
        {right}
      </View>
      <Card>
        <View style={styles.clip}>
          <View style={styles.firstDividerHidden}>{children}</View>
        </View>
      </Card>
    </View>
  );
}

/** Content in a section that isn't a row, e.g. a hint, chips or a text field. */
export function CardBlock({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.block, style]}>{children}</View>;
}

/** An explanation in a section. */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <CardBlock>
      <Text style={styles.hint}>{children}</Text>
    </CardBlock>
  );
}

/** A small text button, e.g. beside a section title. */
export function LinkButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Tappable onPress={onPress} disabled={disabled} style={styles.link}>
      <Text style={styles.linkText}>{title}</Text>
    </Tappable>
  );
}

/** The hairline every block in a section draws above itself. */
export const blockDivider = {
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: colors.border,
} as const;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  clip: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  firstDividerHidden: {
    marginTop: -StyleSheet.hairlineWidth,
  },
  block: {
    ...blockDivider,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  hint: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  link: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  linkText: {
    ...type.caption,
    fontWeight: '600',
    color: colors.accent,
  },
});
