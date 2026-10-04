import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACTION_META, FEED_UNIT_LABELS, PEE_VOLUME_LABELS, STOOL_LABELS } from '@/constants/design';
import { getDaySummaries } from '@/db/repositories';
import { useApp } from '@/context/app-context';
import type { DaySummary, FeedKind } from '@/types/domain';
import { addDays, formatDayRu, todayKey, weekdayShort } from '@/utils/dates';

const RANGES: { key: 'week' | 'month'; label: string; days: number }[] = [
  { key: 'week', label: 'Неделя', days: 7 },
  { key: 'month', label: 'Месяц', days: 28 },
];

const FEED_KIND_LABELS: Record<FeedKind, string> = { dry: 'Сухой', wet: 'Мокрый' };

function pluralTimes(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} раз`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} раза`;
  return `${n} раз`;
}

function uniqueLabels(values: string[], labels: Record<string, string>): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const label = (labels[v] ?? v).toLowerCase();
    if (!seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out.join(', ');
}

function formatFood(summary: DaySummary): string | null {
  if (summary.foodEvents === 0) return null;
  const parts = summary.foodByKind.map((b) => {
    const kindLabel = FEED_KIND_LABELS[b.kind] ?? b.kind;
    if (b.totalAmount > 0) {
      return `${kindLabel} ${b.totalAmount} ${FEED_UNIT_LABELS[b.unit] ?? ''}`.trim();
    }
    return `${kindLabel} без объёма`;
  });
  return `${ACTION_META.food.label}: ${parts.join(' · ')}`;
}

function formatPee(summary: DaySummary): string | null {
  if (summary.peeCount === 0) return null;
  const volumes = summary.peeVolumes.length
    ? ` (${uniqueLabels(summary.peeVolumes, PEE_VOLUME_LABELS)})`
    : '';
  return `${ACTION_META.pee.label} ${pluralTimes(summary.peeCount)}${volumes}`;
}

function formatPoop(summary: DaySummary): string | null {
  if (summary.poopCount === 0) return null;
  const qualities = summary.poopQualities.length
    ? `: ${uniqueLabels(summary.poopQualities, STOOL_LABELS)}`
    : '';
  return `${ACTION_META.poop.label} ${pluralTimes(summary.poopCount)}${qualities}`;
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
  const db = useSQLiteContext();
  const { currentCat, setFocusDay, revision } = useApp();
  const [rangeKey, setRangeKey] = useState<'week' | 'month'>('week');
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
  }, [db, currentCat, days, revision]);

  useEffect(() => {
    load();
  }, [load, currentCat?.id, revision]);

  if (!currentCat) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F3' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F1B15', textAlign: 'center' }}>
            Сначала добавьте кота в настройках
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F3' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F1B15' }}>
            Статистика · {currentCat.name}
          </Text>
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
                    backgroundColor: active ? currentCat.color : '#F6ECE3',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#56423C' }}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

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
                  borderColor: isToday ? currentCat.color : '#DDC0B7',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: isEmpty ? 0 : 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F1B15' }}>
                    {weekdayShort(day)}, {formatDayRu(day)}
                  </Text>
                  {isEmpty ? (
                    <Text style={{ fontSize: 11, color: '#A49C93' }}>Нет записей</Text>
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
          {loading ? 'Загрузка…' : 'Тап по дню — открыть его в дневнике'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
