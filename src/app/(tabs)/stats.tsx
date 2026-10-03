import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACTION_META } from '@/constants/design';
import { getDayCounts } from '@/db/repositories';
import { useApp } from '@/context/app-context';
import type { DayCounts } from '@/types/domain';
import { addDays, formatDayRu, todayKey, weekdayShort } from '@/utils/dates';

const RANGES: { key: 'week' | 'month'; label: string; days: number }[] = [
  { key: 'week', label: 'Неделя', days: 7 },
  { key: 'month', label: 'Месяц', days: 28 },
];

export default function StatsScreen() {
  const db = useSQLiteContext();
  const { currentCat, setFocusDay } = useApp();
  const [rangeKey, setRangeKey] = useState<'week' | 'month'>('week');
  const [counts, setCounts] = useState<Record<string, DayCounts>>({});
  const [loading, setLoading] = useState(false);

  const days = useMemo(() => {
    const today = todayKey();
    const n = RANGES.find((r) => r.key === rangeKey)?.days ?? 7;
    return Array.from({ length: n }, (_, i) => addDays(today, -(n - 1 - i)));
  }, [rangeKey]);

  const load = useCallback(async () => {
    if (!currentCat) return;
    setLoading(true);
    try {
      const result = await getDayCounts(db, currentCat.id, days[0], days[days.length - 1]);
      setCounts(result);
    } finally {
      setLoading(false);
    }
  }, [db, currentCat, days]);

  useEffect(() => {
    load();
  }, [load, currentCat?.id]);

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

        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, paddingHorizontal: 2 }}>
          {[
            { label: 'Какал', color: ACTION_META.poop.main },
            { label: 'Писал', color: ACTION_META.pee.main },
            { label: 'Ел', color: ACTION_META.food.main },
          ].map((l) => (
            <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.color }} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#56423C' }}>{l.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {days.map((day) => {
            const c = counts[day] ?? { poop: 0, pee: 0, food: 0 };
            const total = c.poop + c.pee + c.food;
            const isToday = day === todayKey();
            return (
              <Pressable
                key={day}
                onPress={() => {
                  setFocusDay(day);
                  router.push('/');
                }}
                style={{
                  width: '48%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  padding: 10,
                  borderWidth: isToday ? 2 : 1,
                  borderColor: isToday ? currentCat.color : '#DDC0B7',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#1F1B15' }}>
                    {weekdayShort(day)}, {formatDayRu(day)}
                  </Text>
                  {total === 0 ? (
                    <Text style={{ fontSize: 10, color: '#A49C93' }}>не отсл.</Text>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(
                    [
                      { key: 'poop', value: c.poop, color: ACTION_META.poop.main },
                      { key: 'pee', value: c.pee, color: ACTION_META.pee.main },
                      { key: 'food', value: c.food, color: ACTION_META.food.main },
                    ] as const
                  ).map((item) => (
                    <View key={item.key} style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: item.color }}>
                        {item.value}
                      </Text>
                      <View
                        style={{
                          width: '100%',
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: item.value > 0 ? item.color : '#F0E7DD',
                          marginTop: 2,
                        }}
                      />
                    </View>
                  ))}
                </View>
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
