import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../../ui';

/** A tab's scrolling content. */
export function TabScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
  );
}

/** A note at the top of a tab, e.g. that its calls need the SDK initialized. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  notice: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  noticeText: {
    ...type.caption,
    color: colors.accentOnSoft,
  },
});
