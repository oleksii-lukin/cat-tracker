import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { getEventDef, hasField } from '@/domain/events';
import type { DayEvent, Feed } from '@/types/domain';

interface Props {
  event: DayEvent;
  feeds: Feed[];
  onPress: () => void;
  onRepeat: () => void;
}

/** Human-readable detail lines for an event, driven by its type def. */
function eventDetails(event: DayEvent, feeds: Feed[], t: TFunction): string[] {
  const def = getEventDef(event.type);
  const details: string[] = [];

  if (hasField(def, 'stoolQuality') && event.stoolQuality) {
    details.push(t(`stool.${event.stoolQuality}`));
  }
  if (hasField(def, 'peeVolume') && event.peeVolume) {
    details.push(t(`pee.${event.peeVolume}`));
  }
  if (hasField(def, 'feedId')) {
    const feed = event.feedId ? feeds.find((f) => f.id === event.feedId) ?? null : null;
    if (feed) {
      let amountLabel = feed.name;
      if (event.amount != null) {
        amountLabel += `, ${event.amount} ${t(`units.${feed.unit}`)}`;
      }
      details.push(amountLabel);
      if (hasField(def, 'mealsCount') && event.mealsCount > 1) {
        details.push(`${event.mealsCount} ${t('event.meals', { count: event.mealsCount })}`);
      }
    }
  }
  return details;
}

export function EventCard({ event, feeds, onPress, onRepeat }: Props) {
  const { t } = useTranslation();
  const def = getEventDef(event.type);
  const details = eventDetails(event, feeds, t);

  return (
    <Pressable
      onPress={onPress}
      testID={`event-card-${event.type}`}
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
      <View style={{ width: 4, borderRadius: 2, backgroundColor: def.main }} />

      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: def.soft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18 }}>{def.emoji}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: '700', color: '#1F1B15', flex: 1 }}
          >
            {t(def.labelKey)}
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
              backgroundColor: def.soft,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: def.main }}>
              {t(def.labelKey)}
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
