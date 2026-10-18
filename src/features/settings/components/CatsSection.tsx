import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CatAvatar } from '@/components/cat-avatar';
import { Design } from '@/constants/design';
import { getCoat } from '@/constants/coats';
import type { Cat } from '@/types/domain';

import { sexLabel } from '../utils';

interface Props {
  cats: Cat[];
  onEdit: (cat: Cat) => void;
}

export function CatsSection({ cats, onEdit }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Text style={styles.heading}>{t('settings.cats')}</Text>
      {cats.length === 0 ? <Text style={styles.empty}>{t('settings.noCats')}</Text> : null}
      {cats.map((cat) => (
        <Pressable key={cat.id} onPress={() => onEdit(cat)} style={styles.card}>
          <CatAvatar coat={getCoat(cat.color)} name={cat.name} size={36} />
          <View style={styles.cardBody}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.catMeta}>
              {sexLabel(cat.sex, t)}
              {cat.birthDate ? ` · ${cat.birthDate}` : ''}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: Design.colors.textSecondary,
    marginBottom: 8,
  },
  empty: {
    fontSize: 13,
    color: '#A49C93',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Design.colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Design.colors.outlineVariant,
  },
  cardBody: {
    flex: 1,
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: Design.colors.text,
  },
  catMeta: {
    fontSize: 12,
    color: Design.colors.textSecondary,
  },
  chevron: {
    fontSize: 12,
    color: '#A49C93',
  },
});
