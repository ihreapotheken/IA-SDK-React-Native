import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { IaProductDisplayType } from '@ihreapotheken/ia-sdk-core';
import { IaCartButton } from '@ihreapotheken/ia-sdk-ordering';
import { IaProductGrid } from '@ihreapotheken/ia-sdk-over-the-counter';
import { eventLog } from '../testing/eventLog';
import { ChoiceChips, Section, styles as ui } from './ui';

const productDisplayTypes = [
  { value: IaProductDisplayType.CurrentOffers, label: 'currentOffers' },
  { value: IaProductDisplayType.ProductsOfTheMonth, label: 'productsOfTheMonth' },
  { value: IaProductDisplayType.ProductRecommendations, label: 'productRecommendations' },
  { value: IaProductDisplayType.CustomersAlsoBought, label: 'customersAlsoBought' },
  { value: IaProductDisplayType.Custom, label: 'custom' },
] as const;

const NEEDS_PZN: IaProductDisplayType[] = [
  IaProductDisplayType.ProductRecommendations,
  IaProductDisplayType.CustomersAlsoBought,
];

/**
 * Inline SDK components.
 */
export function ComponentsView() {
  const [selectedGridType, setSelectedGridType] = useState<IaProductDisplayType>(
    IaProductDisplayType.CurrentOffers
  );
  const [pzn, setPzn] = useState('');
  const [customPzns, setCustomPzns] = useState('');
  const [hostCartTaps, setHostCartTaps] = useState(0);

  const pzns = customPzns
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const gridKey = [selectedGridType, pzn, pzns.join(',')].join('|');

  return (
    <ScrollView contentContainerStyle={ui.scrollContent}>
      <Section title="Cart Button">
        <Text style={ui.hint}>
          SDK default: opens the cart, asking the navigation handler first.
        </Text>
        <IaCartButton />
        <View style={styles.gap} />
        <Text style={ui.hint}>
          With onPress: the host handles the tap ({hostCartTaps} taps).
        </Text>
        <IaCartButton
          onPress={() => {
            setHostCartTaps((count) => count + 1);
            eventLog.add('Cart button', 'tapped (host onPress)');
          }}
        />
      </Section>

      <Section title="Product Grid">
        <Text style={ui.hint}>Display type</Text>
        <ChoiceChips
          options={productDisplayTypes}
          selected={selectedGridType}
          onSelect={setSelectedGridType}
        />
        {NEEDS_PZN.includes(selectedGridType) && (
          <TextInput
            style={styles.input}
            value={pzn}
            onChangeText={setPzn}
            placeholder="PZN the recommendations are based on"
            keyboardType="number-pad"
          />
        )}
        {selectedGridType === IaProductDisplayType.Custom && (
          <TextInput
            style={styles.input}
            value={customPzns}
            onChangeText={setCustomPzns}
            placeholder="Comma-separated PZNs"
          />
        )}
      </Section>

      <IaProductGrid
        key={gridKey}
        type={selectedGridType}
        pzn={NEEDS_PZN.includes(selectedGridType) ? pzn : undefined}
        title={selectedGridType === IaProductDisplayType.Custom ? 'Selected for you' : undefined}
        pzns={selectedGridType === IaProductDisplayType.Custom ? pzns : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gap: {
    height: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
    marginTop: 4,
  },
});
