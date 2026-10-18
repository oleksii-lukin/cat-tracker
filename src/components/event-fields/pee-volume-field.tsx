import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import type { PeeVolume } from '@/types/domain';

const OPTIONS: PeeVolume[] = ['low', 'normal', 'high'];

interface Props {
  value: PeeVolume;
  onChange: (v: PeeVolume) => void;
  main: string;
  soft: string;
}

export function PeeVolumeField({ value, onChange, main, soft }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{t('event.volume')}</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[styles.chip, { backgroundColor: active ? soft : Design.colors.surfaceContainer }, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, { color: main }]}>{t(`pee.${opt}`)}</Text>
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
    gap: 8,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
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
