import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import type { Feed } from '@/types/domain';

interface Props {
  feeds: Feed[];
  onAdd: () => void;
  onEdit: (feed: Feed) => void;
  onDelete: (feed: Feed) => void;
}

export function FeedsSection({ feeds, onAdd, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.heading}>{t('settings.feedsSection')}</Text>
        <Pressable onPress={onAdd} style={styles.addButton}>
          <Text style={styles.addButtonText}>{t('settings.addFeed')}</Text>
        </Pressable>
      </View>
      {feeds.map((feed) => (
        <Pressable key={feed.id} onPress={() => onEdit(feed)} style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.feedName}>{feed.name}</Text>
            <Text style={styles.feedMeta}>
              {feed.kind === 'wet' ? t('settings.kindWetLower') : t('settings.kindDryLower')} ·{' '}
              {feed.unit === 'spoon' ? t('settings.unitSpoonsLower') : t('settings.unitGramsLower')}
              {feed.isPreset ? ` · ${t('settings.preset')}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => void onDelete(feed)}
            style={styles.deleteButton}
            testID={`delete-feed-${feed.id}`}
          >
            <Text style={styles.deleteButtonText}>
              {feed.isPreset ? t('common.hide') : t('common.delete')}
            </Text>
          </Pressable>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: Design.colors.textSecondary,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Design.colors.surfaceContainer,
  },
  addButtonText: {
    color: Design.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  feedName: {
    fontSize: 14,
    fontWeight: '600',
    color: Design.colors.text,
  },
  feedMeta: {
    fontSize: 12,
    color: Design.colors.textSecondary,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFDAD6',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93000A',
  },
});
