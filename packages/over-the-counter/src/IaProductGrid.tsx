import { IaSdkPlatformView } from '@ihreapotheken/ia-sdk-core';
import type { IaSdkPlatformViewProps } from '@ihreapotheken/ia-sdk-core';
import { IaProductDisplayType } from '@ihreapotheken/ia-sdk-interface';

export interface IaProductGridProps {
  /** Product collection to display. */
  type: IaProductDisplayType;

  /**
   * Optional product identifier (pzn): the product the recommendation types
   * are based on, or the product the offer types exclude (iOS).
   */
  pzn?: string;

  /** Title of the `custom` type. */
  title?: string;

  /** Products (pzns) of the `custom` type. */
  pzns?: string[];

  /** Whether to show a loading indicator while products load. */
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
  title,
  pzns,
  shouldShowLoading = true,
  style,
}: IaProductGridProps) {
  return (
    <IaSdkPlatformView
      viewId="productGrid"
      componentParams={{
        type,
        pzn: pzn ?? null,
        title: title ?? null,
        pzns: pzns ?? [],
        shouldShowLoading,
      }}
      style={style}
    />
  );
}
