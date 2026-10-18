import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import type { StoolQuality } from '@/types/domain';

const OPTIONS: StoolQuality[] = ['normal', 'hard', 'liquid', 'unusual'];

interface Props {
  value: StoolQuality;
  onChange: (v: StoolQuality) => void;
  main: string;
  soft: string;
}

export function StoolQualityField({ value, onChange, main, soft }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{t('event.stool')}</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              testID={`stool-${opt}`}
              style={[styles.chip, { backgroundColor: active ? soft : Design.colors.surfaceContainer }, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, { color: main }]}>{t(`stool.${opt}`)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Design.colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0,
  },
  chipActive: {
    borderWidth: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
