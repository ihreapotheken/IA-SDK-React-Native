# IaProductGrid

* `IaProductGrid` is a UI component that embeds a grid of pharmacy products directly into your layout.
* Supports multiple product types: current offers, products of the month, product recommendations, customers also
  bought, and custom PZN lists.
* Tapping a product opens product details. If `@ihreapotheken/ia-sdk-ordering` is registered, users can add products
  to the cart.
* You can use the `shouldShowLoading` parameter to control whether you want to hide the grid while loading or show a
  loading indicator.

> [!IMPORTANT]
> SDK initialization and prerequisites (pharmacy selection) must be completed before using this component. To learn
> more, see [How to use components](how_to_use_components.md).

> [!NOTE]
> For a video of the component, see [IAProductGrid](https://github.com/ihreapotheken/IA-SDK-iOS/blob/main/Docs/Components/IAProductGrid.md)
> in the iOS SDK docs. It shows the iOS version.

## Overview
- Package: `@ihreapotheken/ia-sdk-over-the-counter`
- Dependencies:
  - `@ihreapotheken/ia-sdk-ordering` (Optional):
    - Add product to the cart.

## Parameters
- `type`: Product collection to display, see `IaProductDisplayType`.
- `pzn`: Product identifier the recommendation-based types (`ProductRecommendations`, `CustomersAlsoBought`) are based
  on. Without one they show no products.
- `shouldShowLoading`: Whether to show a loading indicator while products load. Defaults to `true`.
- `title`: Title of the grid, for the `Custom` type.
- `pzns`: Product identifiers to show, required for the `Custom` type.
- `style`: Style of the view that wraps the grid.

## Example

`IaProductGrid` with current offers.

```tsx
<IaProductGrid type={IaProductDisplayType.CurrentOffers} />
```

`IaProductGrid` with recommendations for a specific product.

```tsx
<IaProductGrid
  type={IaProductDisplayType.ProductRecommendations}
  pzn="12345678"
/>
```

`IaProductGrid` with your own selection of products.

```tsx
<IaProductGrid
  type={IaProductDisplayType.Custom}
  title="Our picks"
  pzns={['12345678', '87654321']}
/>
```

## Platform differences
- **pzn:** For `CurrentOffers` and `ProductsOfTheMonth`, iOS leaves this product out of the grid. Android ignores it
  for those types.
