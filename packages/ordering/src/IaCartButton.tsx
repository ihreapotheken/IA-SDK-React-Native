import { IaSdkPlatformView } from '@ihreapotheken/ia-sdk-core';
import type { IaSdkPlatformViewProps } from '@ihreapotheken/ia-sdk-core';

export interface IaCartButtonProps {
  /** Optional style overrides for the wrapping view. */
  style?: IaSdkPlatformViewProps['style'];
  /**
   * Called instead of opening the SDK cart when the button is tapped. Without
   * it the SDK cart opens, after asking `iaSdk.onSdkWillNavigateToTarget`.
   */
  onPress?: () => void;
}

/**
 * Inline native cart button component. Renders the SDK's `IaCartButton`
 * SwiftUI view (iOS) / `IaCartButton` Composable (Android).
 */
export function IaCartButton({ style, onPress }: IaCartButtonProps) {
  return (
    <IaSdkPlatformView
      viewId="cartButton"
      componentParams={{ hasTapHandler: onPress != null }}
      onComponentTap={onPress}
      style={style}
    />
  );
}
