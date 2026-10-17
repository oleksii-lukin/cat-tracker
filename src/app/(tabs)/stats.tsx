import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ACTION_META } from '@/constants/design';
import { CoatFrame } from '@/components/coat-frame';
import { getCoat } from '@/constants/coats';
import { getDaySummaries } from '@/db/repositories';
import { useApp } from '@/context/app-context';
import type { DaySummary, FeedKind, PeeVolume, StoolQuality } from '@/types/domain';
import { addDays, formatDay, todayKey, weekdayShort } from '@/utils/dates';

const RANGES = [
  { key: 'week', labelKey: 'stats.rangeWeek', days: 7 },
  { key: 'month', labelKey: 'stats.rangeMonth', days: 28 },
] as const;

type RangeKey = (typeof RANGES)[number]['key'];

function uniqueLabels<T extends string>(values: T[], labelFn: (v: T) => string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const label = labelFn(v).toLowerCase();
    if (!seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out.join(', ');
}

const EMPTY_SUMMARY: DaySummary = {
  poopCount: 0,
  poopQualities: [],
  peeCount: 0,
  peeVolumes: [],
  foodByKind: [],
  foodEvents: 0,
};

export default function StatsScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { currentCat, setFocusDay, revision } = useApp();
  const [rangeKey, setRangeKey] = useState<RangeKey>('week');
  const [summaries, setSummaries] = useState<Record<string, DaySummary>>({});
  const [loading, setLoading] = useState(false);

  const days = useMemo(() => {
    const today = todayKey();
    const n = RANGES.find((r) => r.key === rangeKey)?.days ?? 7;
    return Array.from({ length: n }, (_, i) => addDays(today, -i));
  }, [rangeKey]);

  const load = useCallback(async () => {
    if (!currentCat) return;
    setLoading(true);
    try {
      const result = await getDaySummaries(db, currentCat.id, days[days.length - 1], days[0]);
      setSummaries(result);
    } finally {
      setLoading(false);
    }
  }, [db, currentCat, days]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load, revision]);

  const feedKindLabel = (kind: FeedKind) =>
    kind === 'dry' ? t('stats.feedKindDry') : t('stats.feedKindWet');

  const formatFood = (summary: DaySummary): string | null => {
    if (summary.foodEvents === 0) return null;
    const parts = summary.foodByKind.map((b) => {
      const kindLabel = feedKindLabel(b.kind);
      if (b.totalAmount > 0) {
        return `${kindLabel} ${b.totalAmount} ${t(`units.${b.unit}`)}`.trim();
      }
      return `${kindLabel} ${t('stats.noVolume')}`;
    });
    return `${t('action.food')}: ${parts.join(' · ')}`;
  };

  const formatPee = (summary: DaySummary): string | null => {
    if (summary.peeCount === 0) return null;
    const volumes = summary.peeVolumes.length
      ? ` (${uniqueLabels<PeeVolume>(summary.peeVolumes, (v) => t(`pee.${v}`))})`
      : '';
    return `${t('action.pee')} ${summary.peeCount} ${t('stats.times', { count: summary.peeCount })}${volumes}`;
  };

  const formatPoop = (summary: DaySummary): string | null => {
    if (summary.poopCount === 0) return null;
    const qualities = summary.poopQualities.length
      ? `: ${uniqueLabels<StoolQuality>(summary.poopQualities, (q) => t(`stool.${q}`))}`
      : '';
    return `${t('action.poop')} ${summary.poopCount} ${t('stats.times', { count: summary.poopCount })}${qualities}`;
  };

  if (!currentCat) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F3' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F1B15', textAlign: 'center' }}>
            {t('stats.addCatFirst')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const coat = getCoat(currentCat.color);

  return (
    <CoatFrame
      coat={coat}
      header={
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
              shadowColor: 'rgba(31,27,21,0.25)',
              shadowOpacity: 1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F1B15' }}>
              {t('stats.header', { name: currentCat.name })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {RANGES.map((r) => {
              const active = r.key === rangeKey;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRangeKey(r.key)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active ? coat.accent : '#F6ECE3',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? coat.onAccent : '#56423C' }}>
                    {t(r.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'column', gap: 8 }}>
          {days.map((day) => {
            const s = summaries[day] ?? EMPTY_SUMMARY;
            const isToday = day === todayKey();
            const foodLine = formatFood(s);
            const peeLine = formatPee(s);
            const poopLine = formatPoop(s);
            const isEmpty = !foodLine && !peeLine && !poopLine;
            return (
              <Pressable
                key={day}
                onPress={() => {
                  setFocusDay(day);
                  router.push('/');
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  padding: 12,
                  borderWidth: isToday ? 2 : 1,
                  borderColor: isToday ? coat.accent : '#DDC0B7',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: isEmpty ? 0 : 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F1B15' }}>
                    {weekdayShort(day)}, {formatDay(day)}
                  </Text>
                  {isEmpty ? (
                    <Text style={{ fontSize: 11, color: '#A49C93' }}>{t('stats.noEntries')}</Text>
                  ) : null}
                </View>
                {isEmpty ? null : (
                  <View style={{ flexDirection: 'column', gap: 4 }}>
                    {peeLine ? (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Text style={{ fontSize: 13 }}>{ACTION_META.pee.emoji}</Text>
                        <Text style={{ fontSize: 13, color: '#1F1B15', flex: 1 }}>{peeLine}</Text>
                      </View>
                    ) : null}
                    {poopLine ? (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Text style={{ fontSize: 13 }}>{ACTION_META.poop.emoji}</Text>
                        <Text style={{ fontSize: 13, color: '#1F1B15', flex: 1 }}>{poopLine}</Text>
                      </View>
                    ) : null}
                    {foodLine ? (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Text style={{ fontSize: 13 }}>{ACTION_META.food.emoji}</Text>
                        <Text style={{ fontSize: 13, color: '#1F1B15', flex: 1 }}>{foodLine}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontSize: 11, color: '#A49C93', marginTop: 14, textAlign: 'center' }}>
          {loading ? t('common.loading') : t('stats.tapHint')}
        </Text>
      </ScrollView>
    </CoatFrame>
  );
}
