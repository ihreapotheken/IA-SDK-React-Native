import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import {
  iaSdk,
  IaBaseModule,
  IaPrescriptionScannerType,
  IaSdkScreenEmbedStyle,
  IaSdkScreenViewId,
  type IaOrderingModule,
  type IaOverTheCounterModule,
  type IaPharmacyModule,
  type IaPrescriptionModule,
} from '@ihreapotheken/ia-sdk-core';
import {
  ActionRow,
  CardBlock,
  colors,
  Hint,
  LinkButton,
  Section,
  SwitchRow,
  type,
} from '../../ui';
import { runAction, runLaunch } from '../actions';
import type { EmbeddedScreenRequest } from '../components/EmbeddedScreen';
import { Notice, TabScroll } from '../components/TabScroll';

function prescription() {
  return iaSdk.getModule<IaPrescriptionModule>(IaBaseModule.Prescription);
}

/**
 * Launches every SDK screen, with the options each takes, and embeds them
 * with `IaSdkScreenView`.
 */
export function ScreensTab({
  isInitialized,
  onEmbedScreen,
}: {
  isInitialized: boolean;
  onEmbedScreen: (request: EmbeddedScreenRequest) => void;
}) {
  const [isApofinderCancellable, setIsApofinderCancellable] = useState(true);
  const [focusesSearch, setFocusesSearch] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);

  const updateCamera = (state: {
    isOn?: boolean;
    isFlashlightOn?: boolean;
    isPreviewPaused?: boolean;
  }) => {
    prescription()
      .setScannerCameraState(state)
      .catch((error) => runAction('Camera state', () => Promise.reject(error)));
  };

  const launchScanner = (type: IaPrescriptionScannerType) => {
    // Each launch starts with the camera on, the flashlight off and the preview running.
    setIsCameraOn(true);
    setIsFlashlightOn(false);
    setIsPreviewPaused(false);
    runLaunch('Scanner', () => prescription().launchPrescriptionScanner(type));
  };

  return (
    <TabScroll>
      {!isInitialized && (
        <Notice>Initialize the SDK on the Home tab first.</Notice>
      )}

      <Section title="Core">
        <ActionRow
          title="Start Screen (Dashboard)"
          disabled={!isInitialized}
          onPress={() =>
            runLaunch('Start Screen', () => iaSdk.startDashboardActivity())
          }
        />
        <SwitchRow
          title="Apofinder can be closed without a pharmacy"
          value={isApofinderCancellable}
          onValueChange={setIsApofinderCancellable}
          platform="ios"
        />
        <ActionRow
          title="Apofinder"
          description="The selection is reported in the Events tab"
          disabled={!isInitialized}
          onPress={() =>
            runLaunch('Apofinder', () =>
              iaSdk.launchApofinder({ isCancellable: isApofinderCancellable })
            )
          }
        />
        <ActionRow
          title="Finish All Activities"
          description="Closes the SDK screens"
          onPress={() =>
            runAction('Finish All', () => iaSdk.finishAllActivities())
          }
        />
      </Section>

      <Section title="Modules">
        <ActionRow
          title="Cart"
          disabled={!isInitialized}
          onPress={() =>
            runLaunch('Cart', () =>
              iaSdk
                .getModule<IaOrderingModule>(IaBaseModule.Ordering)
                .launchCartScreen()
            )
          }
        />
        <SwitchRow
          title="Focus the search field"
          value={focusesSearch}
          onValueChange={setFocusesSearch}
          platform="ios"
        />
        <ActionRow
          title="Product Search"
          disabled={!isInitialized}
          onPress={() =>
            runLaunch('Product Search', () =>
              iaSdk
                .getModule<IaOverTheCounterModule>(IaBaseModule.OverTheCounter)
                .launchProductSearchRoute({ focusesOnAppear: focusesSearch })
            )
          }
        />
        <ActionRow
          title="Pharmacy Details"
          disabled={!isInitialized}
          onPress={() =>
            runLaunch('Pharmacy Details', () =>
              iaSdk
                .getModule<IaPharmacyModule>(IaBaseModule.Pharmacy)
                .launchPharmacyDetails()
            )
          }
        />
        <ActionRow
          title="Redeem Prescription"
          description="Scans go through the scan callbacks, see the Events tab"
          disabled={!isInitialized}
          onPress={() =>
            runLaunch('Redeem Prescription', () =>
              prescription().launchRedeemPrescriptionScreen()
            )
          }
        />
      </Section>

      <Section title="Embedded Screens">
        <Hint>
          Embeds the screen in the app with IaSdkScreenView, shown like a pushed
          or presented screen. On iOS the SDK shows a back or close button for
          it; on Android use the close bar or back.
        </Hint>
        {Object.values(IaSdkScreenViewId).map((screen) => (
          <CardBlock key={screen} style={styles.embedRow}>
            <Text style={styles.embedLabel}>{screen}</Text>
            <LinkButton
              title="Push"
              disabled={!isInitialized}
              onPress={() =>
                onEmbedScreen({
                  screen,
                  embedStyle: IaSdkScreenEmbedStyle.Navigation,
                })
              }
            />
            <LinkButton
              title="Present"
              disabled={!isInitialized}
              onPress={() =>
                onEmbedScreen({
                  screen,
                  embedStyle: IaSdkScreenEmbedStyle.Presentation,
                })
              }
            />
          </CardBlock>
        ))}
      </Section>

      <Section title="Prescription Scanner">
        <ActionRow
          title="Prescription Photo Scanner"
          platform="ios"
          disabled={!isInitialized}
          onPress={() => launchScanner(IaPrescriptionScannerType.Prescription)}
        />
        <ActionRow
          title="E-Prescription Scanner"
          platform="ios"
          disabled={!isInitialized}
          onPress={() => launchScanner(IaPrescriptionScannerType.EPrescription)}
        />
        <SwitchRow
          title="Camera on"
          platform="ios"
          value={isCameraOn}
          onValueChange={(value) => {
            setIsCameraOn(value);
            updateCamera({ isOn: value });
          }}
        />
        <SwitchRow
          title="Flashlight on"
          platform="ios"
          value={isFlashlightOn}
          onValueChange={(value) => {
            setIsFlashlightOn(value);
            updateCamera({ isFlashlightOn: value });
          }}
        />
        <SwitchRow
          title="Preview paused"
          platform="ios"
          value={isPreviewPaused}
          onValueChange={(value) => {
            setIsPreviewPaused(value);
            updateCamera({ isPreviewPaused: value });
          }}
        />
        <Hint>
          The Android SDK has no scanner screen; open it from Redeem
          Prescription.
        </Hint>
      </Section>
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  embedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  embedLabel: {
    ...type.body,
    flex: 1,
    color: colors.ink,
  },
});
