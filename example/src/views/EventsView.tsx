import { ScrollView, Text, TouchableOpacity } from 'react-native';
import {
  analyticsLog,
  eventLog,
  useEventLog,
  type ExampleEventLog,
} from '../testing/eventLog';
import {
  updateTestSettings,
  useTestSettings,
  type ExampleScanDecision,
} from '../testing/testSettings';
import { ChoiceChips, EventList, Section, styles, SwitchRow } from './ui';

const SCAN_DECISIONS: readonly { value: ExampleScanDecision; label: string }[] = [
  { value: 'performDefault', label: 'performDefault' },
  { value: 'handled', label: 'handled' },
  { value: 'error', label: 'error' },
];

function LogSection({
  title,
  log,
  emptyText,
}: {
  title: string;
  log: ExampleEventLog;
  emptyText: string;
}) {
  const entries = useEventLog(log);
  return (
    <Section
      title={`${title} (${entries.length})`}
      right={
        <TouchableOpacity onPress={() => log.clear()} disabled={entries.length === 0}>
          <Text style={styles.linkText}>Clear</Text>
        </TouchableOpacity>
      }
    >
      <EventList entries={entries} emptyText={emptyText} />
    </Section>
  );
}

/**
 * Shows the SDK callbacks and events the app received, and switches how the
 * app answers them.
 */
export function EventsView() {
  const settings = useTestSettings();
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Section title="Host Answers">
        <SwitchRow
          title="Host handles navigation targets"
          description="The SDK doesn't open the screen, e.g. the cart"
          value={settings.handlesNavigation}
          onValueChange={(value) => updateTestSettings({ handlesNavigation: value })}
        />
        <SwitchRow
          title="Block the back action"
          description="SDK screens stay open on back"
          platform="android"
          value={settings.blocksBackAction}
          onValueChange={(value) => updateTestSettings({ blocksBackAction: value })}
        />
        <SwitchRow
          title="Log SDK messages"
          description="Adds the SDK's own log messages below"
          platform="ios"
          value={settings.logsSdkMessages}
          onValueChange={(value) => updateTestSettings({ logsSdkMessages: value })}
        />
        <Text style={styles.hint}>Prescription scan answer</Text>
        <ChoiceChips
          options={SCAN_DECISIONS}
          selected={settings.scanDecision}
          onSelect={(value) => updateTestSettings({ scanDecision: value })}
        />
      </Section>

      <LogSection
        title="Analytics"
        log={analyticsLog}
        emptyText="No analytics events yet. They need analytics enabled for the SDK and the user's consent."
      />
      <LogSection
        title="Events"
        log={eventLog}
        emptyText="No events yet. Use the SDK screens, then come back."
      />
    </ScrollView>
  );
}
