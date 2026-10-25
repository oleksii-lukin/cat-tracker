import * as Application from 'expo-application';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';

export function VersionSection() {
  const { t } = useTranslation();
  const version = Application.nativeApplicationVersion;
  const build = Application.nativeBuildVersion;

  const value = build
    ? t('settings.versionBuild', { version: version ?? '—', build })
    : (version ?? t('settings.versionUnknown'));

  return (
    <>
      <Text style={styles.heading}>{t('settings.appSection')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settings.versionLabel')}</Text>
          <Text style={styles.rowValue} testID="version-value">
            {value}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: Design.colors.textSecondary,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Design.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Design.colors.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Design.colors.text,
  },
  rowValue: {
    fontSize: 14,
    color: Design.colors.textSecondary,
    flexShrink: 1,
    textAlign: 'right',
  },
});
