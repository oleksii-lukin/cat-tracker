import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import type { Feed } from '@/types/domain';

interface Props {
  value: string | null;
  onChange: (v: string) => void;
  feeds: Feed[];
  main: string;
  soft: string;
}

export function FeedField({ value, onChange, feeds, main, soft }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{t('event.feed')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {feeds.map((f) => {
            const active = f.id === value;
            return (
              <Pressable
                key={f.id}
                onPress={() => onChange(f.id)}
                style={[styles.chip, { backgroundColor: active ? soft : Design.colors.surfaceContainer }]}
              >
                <Text style={[styles.chipText, { color: main }]}>{f.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
