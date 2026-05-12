import { IaSdkPlatformView } from '@ihreapotheken/ia-sdk-core';
import type { IaSdkPlatformViewProps } from '@ihreapotheken/ia-sdk-core';

export type IaCartButtonProps = Pick<IaSdkPlatformViewProps, 'style'>;

/**
 * Inline native cart button component. Renders the SDK's `IaCartButton`
 * SwiftUI view (iOS) / `IaCartButton` Composable (Android).
 */
export function IaCartButton(props: IaCartButtonProps) {
  return <IaSdkPlatformView viewId="cartButton" style={props.style} />;
}
