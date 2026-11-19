import { StyleSheet, Text, View } from 'react-native';
import { CardBlock, colors, fonts, spacing, type } from '@ia-example/shared';
import type { ExampleEvent } from '../testing/eventLog';

/** Log entries in a section, newest first, or a note while there are none. */
export function EventList({
  entries,
  emptyText,
}: {
  entries: ExampleEvent[];
  emptyText: string;
}) {
  return (
    <CardBlock style={styles.list}>
      {entries.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entry}>
            <Text style={styles.meta}>
              {entry.time.toLocaleTimeString()}
              {'  '}
              <Text style={styles.source}>{entry.source}</Text>
            </Text>
            <Text style={styles.message}>{entry.message}</Text>
          </View>
        ))
      )}
    </CardBlock>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  empty: {
    ...type.caption,
    color: colors.inkTertiary,
  },
  entry: {
    gap: 2,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkTertiary,
  },
  source: {
    fontWeight: '700',
    color: colors.accentOnSoft,
  },
  message: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    color: colors.ink,
  },
});
