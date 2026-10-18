import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import type { WeightEntry } from '@/types/domain';
import { formatDay, formatWeightGrams } from '@/utils/dates';

interface Props {
  weights: WeightEntry[];
  weightGrams: string;
  onWeightGramsChange: (v: string) => void;
  weightDate: string;
  onWeightDateChange: (v: string) => void;
  onAdd: () => void;
}

export function WeightHistory({
  weights,
  weightGrams,
  onWeightGramsChange,
  weightDate,
  onWeightDateChange,
  onAdd,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Text style={styles.title}>{t('settings.weightHistory')}</Text>
      {weights.map((w) => (
        <View key={w.id} style={styles.row}>
          <Text style={styles.weight}>{formatWeightGrams(w.weightGrams)}</Text>
          <Text style={styles.date}>{formatDay(w.measuredOn)}</Text>
        </View>
      ))}
      <View style={styles.form}>
        <TextInput
          value={weightGrams}
          onChangeText={onWeightGramsChange}
          placeholder={t('settings.weightPlaceholder')}
          keyboardType="decimal-pad"
          placeholderTextColor="#A49C93"
          style={styles.input}
        />
        <TextInput
          value={weightDate}
          onChangeText={onWeightDateChange}
          placeholder={t('settings.dateFormat')}
          placeholderTextColor="#A49C93"
          style={styles.input}
        />
        <Pressable onPress={onAdd} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Design.colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Design.colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Design.colors.outlineVariant,
  },
  weight: {
    fontSize: 13,
    color: Design.colors.text,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: Design.colors.textSecondary,
  },
  form: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Design.colors.surfaceLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Design.colors.text,
  },
  addButton: {
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Design.colors.surfaceContainer,
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Design.colors.primary,
  },
});
