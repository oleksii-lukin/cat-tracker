import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import type { LanguagePref } from '@/i18n';

import { LANGUAGE_OPTIONS } from '../constants';

interface Props {
  languagePref: LanguagePref;
  onChange: (pref: LanguagePref) => void;
}

export function LanguageSection({ languagePref, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Text style={styles.heading}>{t('settings.languageSection')}</Text>
      <View style={styles.row}>
        {LANGUAGE_OPTIONS.map((opt) => {
          const active = opt.value === languagePref;
          return (
            <Pressable key={opt.value} onPress={() => void onChange(opt.value)} style={chipStyle(active)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(opt.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function chipStyle(active: boolean) {
  return {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: active ? Design.colors.primary : Design.colors.surfaceContainer,
  };
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: Design.colors.textSecondary,
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Design.colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
});
