import { IaSdkPlatformView } from '@ihreapotheken/ia-sdk-core';
import type { IaSdkPlatformViewProps } from '@ihreapotheken/ia-sdk-core';
import { IaProductDisplayType } from '@ihreapotheken/ia-sdk-interface';

export interface IaProductGridProps {
  /** Product collection to display. */
  type: IaProductDisplayType;

  /** Optional product identifier (pzn) for recommendation-based types. */
  pzn?: string;

  /** Whether to show a loading indicator while products load (iOS only). */
  shouldShowLoading?: boolean;

  /** Optional style overrides for the wrapping view. */
  style?: IaSdkPlatformViewProps['style'];
}

/**
 * Inline native product grid component. Renders the SDK's `IaProductGrid`
 * SwiftUI view (iOS) / `IaProductGrid` Composable (Android).
 */
export function IaProductGrid({
  type,
  pzn,
  shouldShowLoading = true,
  style,
}: IaProductGridProps) {
  return (
    <IaSdkPlatformView
      viewId="productGrid"
      componentParams={{
        type,
        pzn: pzn ?? null,
        shouldShowLoading,
      }}
      style={style}
    />
  );
}
