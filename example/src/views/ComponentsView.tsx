import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IaProductDisplayType } from '@ihreapotheken/ia-sdk-core';
import { IaCartButton } from '@ihreapotheken/ia-sdk-ordering';
import { IaProductGrid } from '@ihreapotheken/ia-sdk-over-the-counter';

const productDisplayTypes: { value: IaProductDisplayType; label: string }[] = [
  { value: IaProductDisplayType.CurrentOffers, label: 'currentOffers' },
  { value: IaProductDisplayType.ProductsOfTheMonth, label: 'productsOfTheMonth' },
  {
    value: IaProductDisplayType.ProductRecommendations,
    label: 'productRecommendations',
  },
  { value: IaProductDisplayType.CustomersAlsoBought, label: 'customersAlsoBought' },
];

interface SectionHeaderProps {
  title: string;
}

function SectionHeader({ title }: SectionHeaderProps) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

interface ChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function ComponentsView() {
  const [selectedGridType, setSelectedGridType] = useState<IaProductDisplayType>(
    IaProductDisplayType.CurrentOffers
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <SectionHeader title="Cart Button" />
      <IaCartButton />

      <View style={styles.gap} />

      <SectionHeader title="Product Grid" />
      <Text style={styles.label}>Display Type</Text>
      <View style={styles.chipRow}>
        {productDisplayTypes.map((option) => (
          <ChoiceChip
            key={option.value}
            label={option.label}
            selected={selectedGridType === option.value}
            onPress={() => setSelectedGridType(option.value)}
          />
        ))}
      </View>

      <View style={styles.gap} />

      <IaProductGrid key={selectedGridType} type={selectedGridType} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipLabel: {
    fontSize: 12,
    color: '#333',
  },
  chipLabelSelected: {
    color: '#fff',
  },
  gap: {
    height: 20,
  },
});
