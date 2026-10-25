import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CatChips } from '@/components/cat-chips';
import { CoatFrame } from '@/components/coat-frame';
import { getCoat } from '@/constants/coats';
import { getDaySummaries } from '@/db/repositories';
import { useApp } from '@/context/app-context';
import { ALL_EVENT_TYPES, getEventDef } from '@/domain/events';
import { StatsFilterSheet } from '@/features/stats/components/StatsFilterSheet';
import { hasAnyEvents } from '@/features/stats/filter';
import { useStatsFilter } from '@/features/stats/useStatsFilter';
import { eventLabel } from '@/i18n/event-label';
import type { DaySummary, EventType, FeedKind, PeeVolume, Sex, StoolQuality } from '@/types/domain';
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
  countsByType: {},
  amountsByType: {},
};

export default function StatsScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const {
    cats,
    currentCat,
    currentCatId,
    setCurrentCatId,
    setFocusDay,
    revision,
    quickActions,
  } = useApp();
  const [rangeKey, setRangeKey] = useState<RangeKey>('week');
  const [summaries, setSummaries] = useState<Record<string, DaySummary>>({});
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filter = useStatsFilter(currentCatId, quickActions);
  // Защита от гонки: применяется только ответ самого позднего запроса,
  // а при смене кота сводки прошлого кота сбрасываются до загрузки новых.
  const requestId = useRef(0);
  const loadedCatId = useRef<string | null>(null);

  const days = useMemo(() => {
    const today = todayKey();
    const n = RANGES.find((r) => r.key === rangeKey)?.days ?? 7;
    return Array.from({ length: n }, (_, i) => addDays(today, -i));
  }, [rangeKey]);

  const load = useCallback(async () => {
    if (!currentCat) return;
    const id = ++requestId.current;
    if (loadedCatId.current !== currentCat.id) {
      loadedCatId.current = currentCat.id;
      setSummaries({});
    }
    setLoading(true);
    try {
      const result = await getDaySummaries(db, currentCat.id, days[days.length - 1], days[0]);
      if (id === requestId.current) setSummaries(result);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [db, currentCat, days]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load, revision]);

  const feedKindLabel = (kind: FeedKind) =>
    kind === 'dry' ? t('stats.feedKindDry') : t('stats.feedKindWet');

  const formatFood = (summary: DaySummary, sex: Sex): string | null => {
    if (summary.foodEvents === 0) return null;
    const parts = summary.foodByKind.map((b) => {
      const kindLabel = feedKindLabel(b.kind);
      if (b.totalAmount > 0) {
        return `${kindLabel} ${b.totalAmount} ${t(`units.${b.unit}`)}`.trim();
      }
      return `${kindLabel} ${t('stats.noVolume')}`;
    });
    return `${eventLabel(t, 'action.food', sex)}: ${parts.join(' · ')}`;
  };

  const formatPee = (summary: DaySummary, sex: Sex): string | null => {
    if (summary.peeCount === 0) return null;
    const volumes = summary.peeVolumes.length
      ? ` (${uniqueLabels<PeeVolume>(summary.peeVolumes, (v) => t(`pee.${v}`))})`
      : '';
    return `${eventLabel(t, 'action.pee', sex)} ${summary.peeCount} ${t('stats.times', { count: summary.peeCount })}${volumes}`;
  };

  const formatPoop = (summary: DaySummary, sex: Sex): string | null => {
    if (summary.poopCount === 0) return null;
    const qualities = summary.poopQualities.length
      ? `: ${uniqueLabels<StoolQuality>(summary.poopQualities, (q) => t(`stool.${q}`))}`
      : '';
    return `${eventLabel(t, 'action.poop', sex)} ${summary.poopCount} ${t('stats.times', { count: summary.poopCount })}${qualities}`;
  };

  // Generic types with a type-level amount (e.g. hairball paste in cm).
  // poop/pee/food have their own detailed formatting above.
  const GENERIC_TYPES: EventType[] = ALL_EVENT_TYPES.filter(
    (et) => et !== 'poop' && et !== 'pee' && et !== 'food'
  );

  const formatGeneric = (summary: DaySummary, type: EventType, sex: Sex): string | null => {
    const count = summary.countsByType[type] ?? 0;
    if (count === 0) return null;
    const def = getEventDef(type);
    const amount = summary.amountsByType[type];
    let line = `${eventLabel(t, def.labelKey, sex)} ${count} ${t('stats.times', { count })}`;
    if (amount && amount.totalAmount > 0) {
      line += ` · ${amount.totalAmount} ${t(`units.${def.amountUnit ?? 'gram'}`)}`;
    }
    return line;
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
  const catSex = currentCat.sex;
  const isFiltered = filter.enabled.size < filter.types.length;
  const filterTextColor = isFiltered ? coat.onAccent : '#56423C';

  return (
    <CoatFrame
      coat={coat}
      header={<CatChips cats={cats} currentCatId={currentCatId} onSelect={setCurrentCatId} />}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Text
            numberOfLines={1}
            style={{ flexShrink: 1, fontSize: 15, fontWeight: '700', color: '#1F1B15' }}
          >
            {t('stats.header', { name: currentCat.name })}
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
                    paddingVertical: 5,
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
            <Pressable
              onPress={() => setFilterOpen(true)}
              testID="stats-filter-button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: isFiltered ? coat.accent : '#F6ECE3',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: filterTextColor }}>
                {t('stats.filter')}
              </Text>
              {isFiltered ? (
                <Text style={{ fontSize: 11, fontWeight: '700', color: filterTextColor }}>
                  {filter.enabled.size}/{filter.types.length}
                </Text>
              ) : null}
            </Pressable>
          </View>
        </View>
        {filter.enabled.size === 0 ? (
          <View
            style={{
              backgroundColor: '#F6ECE3',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#56423C', textAlign: 'center' }}>
              {t('stats.allHidden')}
            </Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'column', gap: 8 }}>
          {days.map((day) => {
            const s = summaries[day] ?? EMPTY_SUMMARY;
            const isToday = day === todayKey();
            const foodLine = filter.enabled.has('food') ? formatFood(s, catSex) : null;
            const peeLine = filter.enabled.has('pee') ? formatPee(s, catSex) : null;
            const poopLine = filter.enabled.has('poop') ? formatPoop(s, catSex) : null;
            const genericLines = GENERIC_TYPES.filter((type) => filter.enabled.has(type))
              .map((type) => ({ type, line: formatGeneric(s, type, catSex) }))
              .filter((x): x is { type: EventType; line: string } => x.line !== null);
            const isEmpty = !foodLine && !peeLine && !poopLine && genericLines.length === 0;
            // День может быть непустым в БД, но полностью скрытым фильтром.
            const statusText = isEmpty
              ? hasAnyEvents(s)
                ? t('stats.hiddenByFilter')
                : t('stats.noEntries')
              : null;
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
                  {statusText ? (
                    <Text style={{ fontSize: 11, color: '#A49C93' }}>{statusText}</Text>
                  ) : null}
                </View>
                {isEmpty ? null : (
                  <View style={{ flexDirection: 'column', gap: 4 }}>
                    {peeLine ? (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Text style={{ fontSize: 13 }}>{getEventDef('pee').emoji}</Text>
                        <Text style={{ fontSize: 13, color: '#1F1B15', flex: 1 }}>{peeLine}</Text>
                      </View>
                    ) : null}
                    {poopLine ? (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Text style={{ fontSize: 13 }}>{getEventDef('poop').emoji}</Text>
                        <Text style={{ fontSize: 13, color: '#1F1B15', flex: 1 }}>{poopLine}</Text>
                      </View>
                    ) : null}
                    {foodLine ? (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Text style={{ fontSize: 13 }}>{getEventDef('food').emoji}</Text>
                        <Text style={{ fontSize: 13, color: '#1F1B15', flex: 1 }}>{foodLine}</Text>
                      </View>
                    ) : null}
                    {genericLines.map(({ type, line }) => (
                      <View key={type} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Text style={{ fontSize: 13 }}>{getEventDef(type).emoji}</Text>
                        <Text style={{ fontSize: 13, color: '#1F1B15', flex: 1 }}>{line}</Text>
                      </View>
                    ))}
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
      <StatsFilterSheet
        visible={filterOpen}
        types={filter.types}
        enabled={filter.enabled}
        sex={catSex}
        onToggle={filter.toggle}
        onClose={() => setFilterOpen(false)}
      />
    </CoatFrame>
  );
}
