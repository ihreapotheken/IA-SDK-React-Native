import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  requireNativeComponent,
  type HostComponent,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';
import type {
  IaSdkScreenEmbedStyle,
  IaSdkScreenViewId,
} from '@ihreapotheken/ia-sdk-interface';

interface SizeChangeEvent {
  width: number;
  height: number;
}

type ComponentParams = {
  [key: string]: string | number | boolean | string[] | null;
};

interface NativeIaSdkPlatformViewProps extends ViewProps {
  viewId: string;
  componentParams?: ComponentParams;
  onSizeChange?: (event: NativeSyntheticEvent<SizeChangeEvent>) => void;
  onComponentTap?: (event: NativeSyntheticEvent<{}>) => void;
  onScreenDismiss?: (event: NativeSyntheticEvent<{}>) => void;
}

const NativeIaSdkPlatformView: HostComponent<NativeIaSdkPlatformViewProps> =
  requireNativeComponent<NativeIaSdkPlatformViewProps>('IaSdkPlatformView');

export interface IaSdkPlatformViewProps {
  /**
   * Native component identifier (e.g. `cartButton`, `productGrid`), or an SDK
   * screen of `IaSdkScreenViewId` (e.g. `cartScreen`). Picked up by the native
   * ViewManager to construct the matching SwiftUI/Compose view.
   */
  viewId: string;

  /**
   * How the app shows an embedded SDK screen, which decides whether the SDK
   * shows a back or a close button (iOS). Without it the SDK shows neither.
   * Only used by SDK screens, not by components.
   */
  embedStyle?: IaSdkScreenEmbedStyle;

  /**
   * Called when the user taps the back or close button of an embedded SDK
   * screen shown because of `embedStyle`, or selects a pharmacy in the
   * embedded Apofinder screen (iOS). The SDK doesn't close the screen itself;
   * the app does.
   */
  onDismiss?: () => void;

  /**
   * Optional configuration parameters forwarded to the native component.
   */
  componentParams?: ComponentParams;

  /**
   * Called when the user taps a component that reports taps, such as the cart
   * button with `hasTapHandler: true` in `componentParams`.
   */
  onComponentTap?: () => void;

  /**
   * Whether the native component reports its intrinsic content size back to
   * JS. When `true` (default), the component sizes itself to the
   * native-reported dimensions. Set to `false` for components that fill the
   * space the host provides (e.g. scrollable views) - the host must then
   * supply bounded constraints (e.g. via a `style={{ height }}` prop).
   */
  selfSizing?: boolean;

  /** Optional style overrides for the wrapping view. */
  style?: ViewProps['style'];
}

/**
 * Hosts a native SDK UI component inside a React Native view tree. Used by
 * the per-component widgets (e.g. `IaCartButton`, `IaProductGrid`) exported
 * by each module.
 */
export function IaSdkPlatformView({
  viewId,
  componentParams: params,
  onComponentTap,
  embedStyle,
  onDismiss,
  selfSizing = true,
  style,
}: IaSdkPlatformViewProps) {
  const handleComponentTap = useCallback(() => {
    onComponentTap?.();
  }, [onComponentTap]);

  const handleScreenDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // The embed style is fixed when native creates the screen, like the screen
  // itself, so a change recreates it.
  const componentParams = useMemo(
    () => (embedStyle ? { ...params, embedStyle } : params),
    [params, embedStyle]
  );

  const [measuredSize, setMeasuredSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const onSizeChange = useCallback(
    (event: NativeSyntheticEvent<SizeChangeEvent>) => {
      const { width, height } = event.nativeEvent;
      setMeasuredSize((previous) => {
        if (
          previous &&
          previous.width === width &&
          previous.height === height
        ) {
          return previous;
        }
        return { width, height };
      });
    },
    []
  );

  if (!selfSizing) {
    return (
      <NativeIaSdkPlatformView
        style={[styles.fill, style]}
        viewId={viewId}
        componentParams={componentParams}
        onComponentTap={handleComponentTap}
        onScreenDismiss={handleScreenDismiss}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: measuredSize?.width,
          height: measuredSize?.height ?? 1,
        },
        style,
      ]}
    >
      <NativeIaSdkPlatformView
        style={styles.fill}
        viewId={viewId}
        componentParams={componentParams}
        onSizeChange={onSizeChange}
        onComponentTap={handleComponentTap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export interface IaSdkScreenViewProps {
  /** The SDK screen to embed. */
  screen: IaSdkScreenViewId;

  /**
   * How the app shows the screen, which decides whether the SDK shows a back
   * or a close button (iOS). Without it the SDK shows neither.
   */
  embedStyle?: IaSdkScreenEmbedStyle;

  /**
   * Called when the user taps the back or close button shown because of
   * `embedStyle`, or selects a pharmacy in the Apofinder screen (iOS). Close
   * the screen here; the SDK doesn't.
   */
  onDismiss?: () => void;

  /** Style of the view. The screen fills it, so give it a size, e.g. `flex: 1`. */
  style?: ViewProps['style'];
}

/**
 * Embeds an SDK screen in the app's own view hierarchy, for example in a tab
 * or a screen of the app's navigator, instead of launching it on top.
 *
 * The screen shows its own navigation bar and navigates within itself.
 * Pharmacies selected in an embedded Apofinder screen aren't reported through
 * `addApofinderPharmacyChangedListener`. On Android the app's activity must
 * be a `ComponentActivity`, as React Native's is.
 */
export function IaSdkScreenView({
  screen,
  embedStyle,
  onDismiss,
  style,
}: IaSdkScreenViewProps) {
  return (
    <IaSdkPlatformView
      viewId={screen}
      selfSizing={false}
      embedStyle={embedStyle}
      onDismiss={onDismiss}
      style={style}
    />
  );
}
