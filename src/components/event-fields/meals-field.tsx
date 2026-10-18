import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { QuantityStepper } from '@/components/quantity-stepper';
import { Design } from '@/constants/design';

const MEALS_QUICK = [1, 2, 3];

interface Props {
  value: number;
  onChange: (v: number) => void;
  main: string;
}

export function MealsField({ value, onChange, main }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{t('event.mealsSection')}</Text>
      <QuantityStepper
        value={value}
        onChange={onChange}
        step={1}
        min={1}
        max={10}
        unitLabel={t('event.meals', { count: value })}
        quickValues={MEALS_QUICK}
        accent={main}
        chipTimes
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    color: Design.colors.textSecondary,
    marginBottom: 4,
  },
});
