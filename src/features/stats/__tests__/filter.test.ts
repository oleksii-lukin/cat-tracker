import { createTestDb } from '@/db/__tests__/test-db';
import { migrateDbIfNeeded } from '@/db/migrate';
import { setMeta } from '@/db/repositories';
import { ALL_EVENT_TYPES } from '@/domain/events';
import { DEFAULT_QUICK_ACTIONS, type QuickActionConfig } from '@/domain/quick-actions';
import {
  defaultStatsFilter,
  filterTypesInOrder,
  hasAnyEvents,
  loadStatsFilter,
  saveStatsFilter,
  statsFilterMetaKey,
} from '@/features/stats/filter';
import type { DaySummary, EventType } from '@/types/domain';

import type { SQLiteDatabase } from 'expo-sqlite';

const ALL_TYPES = new Set(ALL_EVENT_TYPES);

async function freshDb(): Promise<SQLiteDatabase> {
  const db = await createTestDb();
  await migrateDbIfNeeded(db);
  return db;
}

function emptySummary(): DaySummary {
  return {
    poopCount: 0,
    poopQualities: [],
    peeCount: 0,
    peeVolumes: [],
    foodByKind: [],
    foodEvents: 0,
    countsByType: {},
    amountsByType: {},
  };
}

describe('defaultStatsFilter', () => {
  it('включает все типы, когда активны все быстрые блоки', () => {
    expect(defaultStatsFilter(DEFAULT_QUICK_ACTIONS)).toEqual(ALL_TYPES);
  });

  it('выключает типы, чьи быстрые блоки выключены', () => {
    const config = DEFAULT_QUICK_ACTIONS.map((c) => ({
      ...c,
      enabled: c.id !== 'poop' && c.id !== 'hairball',
    }));

    expect(defaultStatsFilter(config)).toEqual(new Set<EventType>(['food', 'pee']));
  });
});

describe('filterTypesInOrder', () => {
  it('следует порядку быстрых блоков', () => {
    const config: QuickActionConfig[] = [
      { id: 'poop', enabled: false, order: 0 },
      { id: 'food', enabled: true, order: 1 },
      { id: 'pee', enabled: true, order: 2 },
      { id: 'hairball', enabled: true, order: 3 },
    ];

    expect(filterTypesInOrder(config)).toEqual(['poop', 'food', 'pee', 'hairball']);
  });

  it('добавляет в конец типы, которых нет в конфиге', () => {
    const config: QuickActionConfig[] = [
      { id: 'food', enabled: true, order: 0 },
      { id: 'pee', enabled: true, order: 1 },
    ];

    expect(filterTypesInOrder(config)).toEqual(['food', 'pee', 'poop', 'hairball']);
  });
});

describe('loadStatsFilter / saveStatsFilter', () => {
  it('возвращает дефолты, когда для кота ничего не сохранено', async () => {
    const db = await freshDb();
    const defaults = new Set<EventType>(['food', 'pee']);

    expect(await loadStatsFilter(db, 'cat-1', defaults)).toEqual(defaults);
  });

  it('сохранённый выбор переживает перезагрузку', async () => {
    const db = await freshDb();
    await saveStatsFilter(db, 'cat-1', new Set<EventType>(['food', 'poop']));

    const loaded = await loadStatsFilter(db, 'cat-1', ALL_TYPES);

    expect(loaded).toEqual(new Set<EventType>(['food', 'poop']));
  });

  it('явный false выключенного типа не затирается включённым дефолтом', async () => {
    const db = await freshDb();
    await saveStatsFilter(db, 'cat-1', new Set<EventType>(['food']));

    const loaded = await loadStatsFilter(db, 'cat-1', ALL_TYPES);

    expect(loaded.has('hairball')).toBe(false);
    expect(loaded.has('food')).toBe(true);
  });

  it('фильтры разных котов независимы', async () => {
    const db = await freshDb();
    await saveStatsFilter(db, 'cat-1', new Set<EventType>(['food']));
    await saveStatsFilter(db, 'cat-2', new Set<EventType>(['pee']));

    expect(await loadStatsFilter(db, 'cat-1', ALL_TYPES)).toEqual(new Set<EventType>(['food']));
    expect(await loadStatsFilter(db, 'cat-2', ALL_TYPES)).toEqual(new Set<EventType>(['pee']));
  });

  it('переживает повреждённый JSON в app_meta', async () => {
    const db = await freshDb();
    const defaults = new Set<EventType>(['pee']);
    await setMeta(db, statsFilterMetaKey('cat-1'), '{broken json');

    expect(await loadStatsFilter(db, 'cat-1', defaults)).toEqual(defaults);
  });

  it('переживает JSON не-объекта в app_meta', async () => {
    const db = await freshDb();
    const defaults = new Set<EventType>(['pee']);
    await setMeta(db, statsFilterMetaKey('cat-1'), '["food"]');

    expect(await loadStatsFilter(db, 'cat-1', defaults)).toEqual(defaults);
  });

  it('частично сохранённый объект: недостающие типы берутся из дефолтов', async () => {
    const db = await freshDb();
    await setMeta(db, statsFilterMetaKey('cat-1'), '{"food": false}');

    const loaded = await loadStatsFilter(db, 'cat-1', ALL_TYPES);

    expect(loaded).toEqual(new Set<EventType>(['pee', 'poop', 'hairball']));
  });

  it('значение не-boolean для типа игнорируется в пользу дефолта', async () => {
    const db = await freshDb();
    await setMeta(db, statsFilterMetaKey('cat-1'), '{"food": "yes"}');

    const loaded = await loadStatsFilter(db, 'cat-1', ALL_TYPES);

    expect(loaded.has('food')).toBe(true);
  });
});

describe('hasAnyEvents', () => {
  it('false для пустой сводки и нулевых счётчиков', () => {
    expect(hasAnyEvents(emptySummary())).toBe(false);
    expect(hasAnyEvents({ ...emptySummary(), countsByType: { hairball: 0 } })).toBe(false);
  });

  it('true, когда в дне есть хотя бы одно событие', () => {
    expect(hasAnyEvents({ ...emptySummary(), countsByType: { hairball: 2 } })).toBe(true);
  });
});
