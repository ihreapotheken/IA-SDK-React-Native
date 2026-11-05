import type { ReactNode } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ExampleEvent } from '../testing/eventLog';

/**
 * Shows the result of an SDK call, or its error with the error code.
 */
export async function runAction<T>(
  title: string,
  action: () => Promise<T>,
  describeResult?: (result: T) => string
) {
  try {
    const result = await action();
    const message = describeResult
      ? describeResult(result)
      : result === undefined
        ? 'Done'
        : typeof result === 'string'
          ? result
          : JSON.stringify(result, null, 2);
    Alert.alert(title, message);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const message = error instanceof Error ? error.message : String(error);
    Alert.alert(`${title} failed`, code ? `${code}\n${message}` : message);
  }
}

export function Section({
  title,
  children,
  right,
}: {
  title: string;
  children?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function ActionButton({
  title,
  description,
  onPress,
  disabled = false,
  platform,
}: {
  title: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
  /** Only shown on this platform. */
  platform?: 'ios' | 'android';
}) {
  if (platform && Platform.OS !== platform) {
    return null;
  }
  const suffix = platform ? (platform === 'ios' ? ' (iOS)' : ' (Android)') : '';
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {title}
        {suffix}
      </Text>
      {description ? (
        <Text style={styles.buttonDescription}>{description}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export function SwitchRow({
  title,
  description,
  value,
  onValueChange,
  platform,
}: {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  platform?: 'ios' | 'android';
}) {
  if (platform && Platform.OS !== platform) {
    return null;
  }
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={styles.switchTitle}>{title}</Text>
        {description ? (
          <Text style={styles.buttonDescription}>{description}</Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

export function ChoiceChips<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[styles.chip, selected === option.value && styles.chipSelected]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.chipLabel,
              selected === option.value && styles.chipLabelSelected,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function EventList({
  entries,
  emptyText,
  style,
}: {
  entries: ExampleEvent[];
  emptyText: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.eventLog, style]}>
      {entries.length === 0 ? (
        <Text style={styles.eventLogEmpty}>{emptyText}</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.eventLogEntry}>
            <Text style={styles.eventLogTime}>
              {entry.time.toLocaleTimeString()}
            </Text>
            <Text style={styles.eventLogSource}>[{entry.source}]</Text>
            <Text style={styles.eventLogMessage}>{entry.message}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const monospace = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  buttonTextDisabled: {
    color: '#888',
  },
  buttonDescription: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    flex: 1,
    paddingRight: 8,
  },
  switchTitle: {
    fontSize: 14,
    color: '#333',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cccccc',
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipLabel: {
    fontSize: 12,
    color: '#333',
  },
  chipLabelSelected: {
    color: '#fff',
  },
  eventLog: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  eventLogEmpty: {
    color: '#888',
    fontStyle: 'italic',
    fontSize: 12,
  },
  eventLogEntry: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  eventLogTime: {
    color: '#888',
    fontSize: 10,
    marginRight: 6,
    fontFamily: monospace,
  },
  eventLogSource: {
    color: '#4CAF50',
    fontSize: 10,
    marginRight: 6,
    fontFamily: monospace,
  },
  eventLogMessage: {
    color: '#fff',
    fontSize: 10,
    flexBasis: '100%',
    fontFamily: monospace,
  },
  linkText: {
    fontSize: 12,
    color: '#007AFF',
  },
});
