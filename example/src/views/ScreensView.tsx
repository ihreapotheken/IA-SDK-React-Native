import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import type { EmbeddedScreenRequest } from './EmbeddedScreen';
import { ActionButton, runAction, runLaunch, Section, styles, SwitchRow } from './ui';

function prescription() {
  return iaSdk.getModule<IaPrescriptionModule>(IaBaseModule.Prescription);
}

/**
 * Launches every SDK screen, with the options each takes, and embeds them
 * with `IaSdkScreenView`.
 */
export function ScreensView({
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
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {!isInitialized && (
        <Text style={styles.hint}>Initialize the SDK on the Home tab first.</Text>
      )}

      <Section title="Core">
        <ActionButton
          title="Start Screen (Dashboard)"
          disabled={!isInitialized}
          onPress={() => runLaunch('Start Screen', () => iaSdk.startDashboardActivity())}
        />
        <SwitchRow
          title="Apofinder can be closed without a pharmacy"
          value={isApofinderCancellable}
          onValueChange={setIsApofinderCancellable}
          platform="ios"
        />
        <ActionButton
          title="Apofinder"
          description="The selection is reported in the Events tab"
          disabled={!isInitialized}
          onPress={() =>
            runLaunch('Apofinder', () =>
              iaSdk.launchApofinder({ isCancellable: isApofinderCancellable })
            )
          }
        />
        <ActionButton
          title="Finish All Activities"
          description="Closes the SDK screens"
          onPress={() => runAction('Finish All', () => iaSdk.finishAllActivities())}
        />
      </Section>

      <Section title="Modules">
        <ActionButton
          title="Cart"
          disabled={!isInitialized}
          onPress={() =>
            runLaunch('Cart', () =>
              iaSdk.getModule<IaOrderingModule>(IaBaseModule.Ordering).launchCartScreen()
            )
          }
        />
        <SwitchRow
          title="Focus the search field"
          value={focusesSearch}
          onValueChange={setFocusesSearch}
          platform="ios"
        />
        <ActionButton
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
        <ActionButton
          title="Pharmacy Details"
          disabled={!isInitialized}
          onPress={() =>
            runLaunch('Pharmacy Details', () =>
              iaSdk.getModule<IaPharmacyModule>(IaBaseModule.Pharmacy).launchPharmacyDetails()
            )
          }
        />
        <ActionButton
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
        <Text style={styles.hint}>
          Embeds the screen in the app with IaSdkScreenView, shown like a pushed
          or presented screen. On iOS the SDK shows a back or close button for
          it; on Android use the close bar or back.
        </Text>
        {Object.values(IaSdkScreenViewId).map((screen) => (
          <View key={screen} style={embedStyles.row}>
            <Text style={embedStyles.label}>{screen}</Text>
            <TouchableOpacity
              disabled={!isInitialized}
              onPress={() =>
                onEmbedScreen({ screen, embedStyle: IaSdkScreenEmbedStyle.Navigation })
              }
            >
              <Text style={[styles.linkText, !isInitialized && embedStyles.disabled]}>Push</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!isInitialized}
              onPress={() =>
                onEmbedScreen({ screen, embedStyle: IaSdkScreenEmbedStyle.Presentation })
              }
            >
              <Text style={[styles.linkText, !isInitialized && embedStyles.disabled]}>Present</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Section>

      <Section title="Prescription Scanner">
        <ActionButton
          title="Prescription Photo Scanner"
          platform="ios"
          disabled={!isInitialized}
          onPress={() => launchScanner(IaPrescriptionScannerType.Prescription)}
        />
        <ActionButton
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
        <Text style={styles.hint}>
          The Android SDK has no scanner screen; open it from Redeem Prescription.
        </Text>
      </Section>
    </ScrollView>
  );
}

const embedStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  disabled: {
    color: '#aaa',
  },
});
