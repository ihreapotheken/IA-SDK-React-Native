import { APPSDK_ACCESS_KEY } from '@env';
import { IaHeaderStyle, type InitConfig } from '@ihreapotheken/ia-sdk-core';
import { CLIENT_ID, serverEnvironment } from '../../sdkConfig';

/** The initialization options the Home tab switches, to test the configuration. */
export interface InitOptions {
  shouldFetchThemeFromRemote: boolean;
  isImprintHandledByHostApp: boolean;
  runOnboardingIfNeeded: boolean;
  showTestPharmaciesInApofinder: boolean;
  customUiColors: boolean;
  hideMascotIllustrations: boolean;
  cardLinkSaveCardEnabled: boolean;
}

export const DEFAULT_INIT_OPTIONS: InitOptions = {
  shouldFetchThemeFromRemote: false,
  isImprintHandledByHostApp: false,
  runOnboardingIfNeeded: false,
  showTestPharmaciesInApofinder: false,
  customUiColors: false,
  hideMascotIllustrations: false,
  cardLinkSaveCardEnabled: true,
};

/** Purple monotone header and rounded buttons, for "Custom UI colors". */
const customColors = {
  header: {
    style: IaHeaderStyle.Monotone,
    primaryColor: 0xff6a1b9a,
    secondaryColor: 0xffce93d8,
  },
  primaryButton: {
    backgroundColor: 0xff6a1b9a,
    textColor: 0xffffffff,
    borderRadius: 24,
  },
  secondaryButton: {
    borderColor: 0xff6a1b9a,
    textColor: 0xff6a1b9a,
    borderWidth: 2,
    borderRadius: 24,
  },
};

export function buildInitConfig(options: InitOptions): InitConfig {
  return {
    accessKey: APPSDK_ACCESS_KEY as string,
    clientId: CLIENT_ID,
    serverEnvironment,
    shouldFetchThemeFromRemote: options.shouldFetchThemeFromRemote,
    footer: { isImprintHandledByHostApp: options.isImprintHandledByHostApp },
    initialization: {
      prerequisites: { runOnboardingIfNeeded: options.runOnboardingIfNeeded },
    },
    uiConfiguration: {
      shouldShowMascotIllustrations: !options.hideMascotIllustrations,
      ...(options.customUiColors ? customColors : {}),
    },
    qaConfiguration: options.showTestPharmaciesInApofinder
      ? { showTestPharmaciesInApofinder: true }
      : undefined,
    cardLink: { isSaveCardEnabled: options.cardLinkSaveCardEnabled },
  };
}
