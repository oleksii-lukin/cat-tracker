import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ACTION_META } from '@/constants/design';
import type { DayEvent, Feed } from '@/types/domain';

interface Props {
  event: DayEvent;
  feeds: Feed[];
  onPress: () => void;
  onRepeat: () => void;
}

export function EventCard({ event, feeds, onPress, onRepeat }: Props) {
  const { t } = useTranslation();
  const meta = ACTION_META[event.type];
  const feed = event.feedId ? feeds.find((f) => f.id === event.feedId) ?? null : null;

  const details: string[] = [];
  if (event.type === 'poop' && event.stoolQuality) {
    details.push(t(`stool.${event.stoolQuality}`));
  }
  if (event.type === 'pee' && event.peeVolume) {
    details.push(t(`pee.${event.peeVolume}`));
  }
  if (event.type === 'food' && feed) {
    let amountLabel = feed.name;
    if (event.amount != null) {
      amountLabel += `, ${event.amount} ${t(`units.${feed.unit}`)}`;
    }
    details.push(amountLabel);
    if (event.mealsCount > 1) {
      details.push(`${event.mealsCount} ${t('event.meals', { count: event.mealsCount })}`);
    }
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        gap: 12,
        overflow: 'hidden',
        shadowColor: 'rgba(84,78,71,0.08)',
        shadowOpacity: 1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View style={{ width: 4, borderRadius: 2, backgroundColor: meta.main }} />

      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: meta.soft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: '700', color: '#1F1B15', flex: 1 }}
          >
            {t(`action.${event.type}`)}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', flexShrink: 0 }}>
            {event.eventTime ?? '—'}
          </Text>
        </View>

        {details.map((d, i) => (
          <Text
            key={`${event.id}-d${i}`}
            numberOfLines={2}
            style={{ fontSize: 13, color: '#56423C', marginTop: 2 }}
          >
            {d}
          </Text>
        ))}
        {event.note ? (
          <Text numberOfLines={2} style={{ fontSize: 13, color: '#56423C', marginTop: 2 }}>
            {event.note}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <View
            style={{
              backgroundColor: meta.soft,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: meta.main }}>
              {t(`action.${event.type}`)}
            </Text>
          </View>
          {event.isUncertain ? (
            <View
              style={{
                backgroundColor: '#F6ECE3',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#56423C' }}>
                {t('event.uncertainChip')}
              </Text>
            </View>
          ) : null}
          {event.photoUri ? (
            <Image source={{ uri: event.photoUri }} style={{ width: 28, height: 28, borderRadius: 6 }} />
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onRepeat}
        hitSlop={8}
        style={{ justifyContent: 'center', paddingHorizontal: 4 }}
      >
        <Text style={{ fontSize: 16, color: '#A49C93' }}>↻</Text>
      </Pressable>
    </Pressable>
  );
}
