import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IaProductDisplayType } from '@ihreapotheken/ia-sdk-core';
import { IaCartButton } from '@ihreapotheken/ia-sdk-ordering';
import { IaProductGrid } from '@ihreapotheken/ia-sdk-over-the-counter';
import {
  CardBlock,
  ChoiceChips,
  Hint,
  Section,
  spacing,
  TextField,
} from '../../ui';
import { TabScroll } from '../components/TabScroll';
import { eventLog } from '../testing/eventLog';

const productDisplayTypes = [
  { value: IaProductDisplayType.CurrentOffers, label: 'currentOffers' },
  {
    value: IaProductDisplayType.ProductsOfTheMonth,
    label: 'productsOfTheMonth',
  },
  {
    value: IaProductDisplayType.ProductRecommendations,
    label: 'productRecommendations',
  },
  {
    value: IaProductDisplayType.CustomersAlsoBought,
    label: 'customersAlsoBought',
  },
  { value: IaProductDisplayType.Custom, label: 'custom' },
] as const;

const NEEDS_PZN: IaProductDisplayType[] = [
  IaProductDisplayType.ProductRecommendations,
  IaProductDisplayType.CustomersAlsoBought,
];

/**
 * Inline SDK components.
 */
export function ViewsTab() {
  const [selectedGridType, setSelectedGridType] =
    useState<IaProductDisplayType>(IaProductDisplayType.CurrentOffers);
  const [pzn, setPzn] = useState('');
  const [customPzns, setCustomPzns] = useState('');
  const [hostCartTaps, setHostCartTaps] = useState(0);

  const pzns = customPzns
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const gridKey = [selectedGridType, pzn, pzns.join(',')].join('|');

  return (
    <TabScroll>
      <Section title="Cart Button">
        <Hint>
          SDK default: opens the cart, asking the navigation handler first.
        </Hint>
        <CardBlock>
          <IaCartButton />
        </CardBlock>
        <Hint>
          With onPress: the host handles the tap ({hostCartTaps} taps).
        </Hint>
        <CardBlock>
          <IaCartButton
            onPress={() => {
              setHostCartTaps((count) => count + 1);
              eventLog.add('Cart button', 'tapped (host onPress)');
            }}
          />
        </CardBlock>
      </Section>

      <Section title="Product Grid">
        <CardBlock>
          <ChoiceChips
            options={productDisplayTypes}
            selected={selectedGridType}
            onSelect={setSelectedGridType}
          />
          {NEEDS_PZN.includes(selectedGridType) && (
            <TextField
              label="PZN the recommendations are based on"
              value={pzn}
              onChangeText={setPzn}
              keyboardType="number-pad"
            />
          )}
          {selectedGridType === IaProductDisplayType.Custom && (
            <TextField
              label="Comma-separated PZNs"
              value={customPzns}
              onChangeText={setCustomPzns}
            />
          )}
        </CardBlock>
      </Section>

      <View style={styles.grid}>
        <IaProductGrid
          key={gridKey}
          type={selectedGridType}
          pzn={NEEDS_PZN.includes(selectedGridType) ? pzn : undefined}
          title={
            selectedGridType === IaProductDisplayType.Custom
              ? 'Selected for you'
              : undefined
          }
          pzns={
            selectedGridType === IaProductDisplayType.Custom ? pzns : undefined
          }
        />
      </View>
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: spacing.lg,
  },
});
