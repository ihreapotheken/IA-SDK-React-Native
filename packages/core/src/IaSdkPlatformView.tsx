import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  requireNativeComponent,
  type HostComponent,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';

interface SizeChangeEvent {
  width: number;
  height: number;
}

interface NativeIaSdkPlatformViewProps extends ViewProps {
  viewId: string;
  componentParams?: { [key: string]: string | number | boolean | null };
  onSizeChange?: (event: NativeSyntheticEvent<SizeChangeEvent>) => void;
}

const NativeIaSdkPlatformView: HostComponent<NativeIaSdkPlatformViewProps> =
  requireNativeComponent<NativeIaSdkPlatformViewProps>('IaSdkPlatformView');

export interface IaSdkPlatformViewProps {
  /**
   * Native component identifier (e.g. `cartButton`, `productGrid`). Picked up
   * by the native ViewManager to construct the matching SwiftUI/Compose view.
   */
  viewId: string;

  /**
   * Optional configuration parameters forwarded to the native component.
   */
  componentParams?: { [key: string]: string | number | boolean | null };

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
  componentParams,
  selfSizing = true,
  style,
}: IaSdkPlatformViewProps) {
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
