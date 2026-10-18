import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { QuantityStepper } from '@/components/quantity-stepper';
import { Design } from '@/constants/design';
import type { Feed } from '@/types/domain';

interface Props {
  value: number;
  onChange: (v: number) => void;
  /** Selected feed resolves the unit (spoon vs gram); defaults to gram. */
  feeds: Feed[];
  feedId: string | null;
  /** Type-level unit (e.g. 'cm' for paste) overrides the feed-derived one. */
  unitOverride?: string;
  main: string;
}

const QUICK_VALUES: Record<string, number[]> = {
  spoon: [0.5, 1, 1.5, 2, 3],
  gram: [4, 6, 10, 15, 20, 30, 35],
  cm: [1, 2, 3, 5],
};

export function AmountField({ value, onChange, feeds, feedId, unitOverride, main }: Props) {
  const { t } = useTranslation();
  const unit = unitOverride ?? feeds.find((f) => f.id === feedId)?.unit ?? 'gram';

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{t('event.amount', { unit: t(`units.${unit}`) })}</Text>
      <QuantityStepper
        value={value}
        onChange={onChange}
        step={unit === 'spoon' ? 0.5 : 1}
        min={0}
        max={100}
        unitLabel={t(`units.${unit}`)}
        quickValues={QUICK_VALUES[unit] ?? QUICK_VALUES.gram}
        accent={main}
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
