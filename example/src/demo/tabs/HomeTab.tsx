import { useState } from 'react';
import { iaSdk, IaSdkInitializationState } from '@ihreapotheken/ia-sdk-core';
import {
  ActionRow,
  Button,
  CardBlock,
  Hint,
  Section,
  SwitchRow,
} from '../../ui';
import { runAction } from '../actions';
import { TabScroll } from '../components/TabScroll';
import type { InitOptions } from '../sdk/initConfig';

/** The initialization options, and the SDK's state and prerequisites. */
export function HomeTab({
  options,
  onOptionsChange,
  isRegistered,
  isInitialized,
  initState,
  onInitialize,
}: {
  options: InitOptions;
  onOptionsChange: (options: InitOptions) => void;
  isRegistered: boolean;
  isInitialized: boolean;
  initState: IaSdkInitializationState;
  onInitialize: (options: InitOptions) => Promise<void>;
}) {
  const [isInitializing, setIsInitializing] = useState(false);
  const option = (key: keyof InitOptions) => ({
    value: options[key],
    onValueChange: (value: boolean) =>
      onOptionsChange({ ...options, [key]: value }),
  });

  const initialize = async () => {
    setIsInitializing(true);
    try {
      await onInitialize(options);
    } catch (e) {
      await runAction('Initialize', () => Promise.reject(e));
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <TabScroll>
      <Section title="Initialization">
        <Hint>Options apply to the first successful initialize call.</Hint>
        <SwitchRow
          title="Fetch theme from remote"
          {...option('shouldFetchThemeFromRemote')}
        />
        <SwitchRow
          title="Host handles imprint"
          description="The imprint button reports the imprint navigation target"
          {...option('isImprintHandledByHostApp')}
        />
        <SwitchRow
          title="Run onboarding in prerequisites"
          {...option('runOnboardingIfNeeded')}
        />
        <SwitchRow
          title="Show test pharmacies in Apofinder (QA)"
          {...option('showTestPharmaciesInApofinder')}
        />
        <SwitchRow
          title="Custom UI colors"
          description="Purple monotone header and rounded buttons"
          {...option('customUiColors')}
        />
        <SwitchRow
          title="Hide mascot illustrations"
          {...option('hideMascotIllustrations')}
        />
        <SwitchRow
          title="CardLink saves cards (SDK-started flows)"
          {...option('cardLinkSaveCardEnabled')}
        />
        <CardBlock>
          <Button
            title={
              initState === IaSdkInitializationState.Initialized
                ? 'Initialized'
                : 'Initialize'
            }
            onPress={initialize}
            isBusy={isInitializing}
            // cleanCache(initialization) uninitializes the SDK, so it can be initialized again.
            disabled={
              !isRegistered ||
              initState === IaSdkInitializationState.Initialized
            }
          />
        </CardBlock>
      </Section>

      <Section title="State">
        <ActionRow
          title="Is Initialized"
          onPress={() =>
            runAction('Is Initialized', () => iaSdk.isInitialized(), String)
          }
        />
        <ActionRow
          title="Get Initialization State"
          onPress={() =>
            runAction('Initialization State', () =>
              iaSdk.getInitializationState()
            )
          }
        />
        <ActionRow
          title="Get Environment"
          onPress={() => runAction('Environment', () => iaSdk.getEnvironment())}
        />
      </Section>

      <Section title="Prerequisites">
        <ActionRow
          title="Launch Prerequisite Flow"
          description="Legal documents, onboarding and pharmacy selection"
          disabled={!isInitialized}
          onPress={() =>
            runAction(
              'Prerequisite Flow',
              () => iaSdk.launchPrerequisiteFlow(),
              (result) => (result.isCancelled ? 'Cancelled' : 'Completed')
            )
          }
        />
        <ActionRow
          title="Is Prerequisite Flow Completed"
          disabled={!isInitialized}
          onPress={() =>
            runAction(
              'Prerequisite Flow Completed',
              () => iaSdk.isPrerequisiteFlowCompleted(),
              String
            )
          }
        />
      </Section>
    </TabScroll>
  );
}
