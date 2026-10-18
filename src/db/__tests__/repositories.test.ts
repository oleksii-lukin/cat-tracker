import {
  addWeightEntry,
  createCat,
  createEvent,
  createFeed,
  createNote,
  deleteMeta,
  getDaySummaries,
  getMeta,
  hasDataBefore,
  listCats,
  listEventsBetween,
  listFeeds,
  listNotesBetween,
  listWeightEntries,
  localizePresetFeeds,
  setMeta,
  softDeleteCat,
  softDeleteEvent,
  softDeleteFeed,
  softDeleteNote,
  softDeleteWeightEntry,
  updateCat,
  updateEvent,
  updateFeed,
  updateNote,
} from '@/db/repositories';
import { migrateDbIfNeeded, SEED_FEED_IDS } from '@/db/migrate';
import { PRESET_FEED_NAMES } from '@/i18n';
import type { Cat, Feed } from '@/types/domain';

import { createTestDb } from './test-db';

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

async function freshDb(): Promise<TestDb> {
  const db = await createTestDb();
  await migrateDbIfNeeded(db);
  return db;
}

async function seedCat(db: TestDb, name = 'Барсик'): Promise<Cat> {
  return createCat(db, { name, sex: 'male', birthDate: null, color: 'gray' });
}

/* ---------- Cats ---------- */

describe('Cats', () => {
  it('create + list: кот появляется в выборке', async () => {
    const db = await freshDb();
    const cat = await seedCat(db, 'Маркиз');

    const cats = await listCats(db);
    expect(cats).toHaveLength(1);
    expect(cats[0]).toMatchObject({ id: cat.id, name: 'Маркиз', sex: 'male', color: 'gray' });
    expect(cats[0].deletedAt).toBeNull();
  });

  it('list отсортирован по created_at ASC', async () => {
    const db = await freshDb();
    await seedCat(db, 'Первый');
    await seedCat(db, 'Второй');

    // Сделаем первого старше вручную (created_at одинаков в одном тесте).
    await db.runAsync(
      `UPDATE cats SET created_at = '2020-01-01T00:00:00.000Z' WHERE name = 'Первый'`
    );

    const cats = await listCats(db);
    expect(cats.map((c) => c.name)).toEqual(['Первый', 'Второй']);
  });

  it('soft delete исключает кота из выборки', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);

    await softDeleteCat(db, cat.id);

    expect(await listCats(db)).toHaveLength(0);
  });

  it('update меняет поля', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);

    await updateCat(db, cat.id, { name: 'Норик', sex: 'female', birthDate: '2024-05-01', color: 'calico' });

    const [updated] = await listCats(db);
    expect(updated).toMatchObject({ name: 'Норик', sex: 'female', birthDate: '2024-05-01', color: 'calico' });
  });
});

/* ---------- Feeds ---------- */

describe('Feeds', () => {
  it('list: сначала пресеты (is_preset DESC, name ASC)', async () => {
    const db = await freshDb();
    await createFeed(db, { name: 'ААА свой', kind: 'dry', unit: 'gram' });

    const feeds = await listFeeds(db);
    expect(feeds).toHaveLength(3);
    expect(feeds[0].isPreset).toBe(true);
    expect(feeds[1].isPreset).toBe(true);
    expect(feeds[2]).toMatchObject({ name: 'ААА свой', isPreset: false });
  });

  it('update и soft delete', async () => {
    const db = await freshDb();
    const feed = await createFeed(db, { name: 'Временный', kind: 'wet', unit: 'spoon' });

    await updateFeed(db, feed.id, { name: 'Постоянный', kind: 'dry', unit: 'gram' });
    const [custom] = (await listFeeds(db)).filter((f) => !f.isPreset);
    expect(custom).toMatchObject({ name: 'Постоянный', kind: 'dry', unit: 'gram' });

    await softDeleteFeed(db, feed.id);
    expect((await listFeeds(db)).filter((f) => !f.isPreset)).toHaveLength(0);
  });

  it('мягкое удаление пресета скрывает его, но не стирает', async () => {
    const db = await freshDb();
    await softDeleteFeed(db, SEED_FEED_IDS.wet);

    const feeds = await listFeeds(db);
    expect(feeds).toHaveLength(1);
    expect(feeds[0].id).toBe(SEED_FEED_IDS.dry);
  });
});

/* ---------- Events ---------- */

describe('Events', () => {
  it('create + list с дефолтами (mealsCount = 1, isUncertain = false)', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);

    const event = await createEvent(db, {
      catId: cat.id,
      type: 'food',
      eventDate: '2026-01-05',
      eventTime: '08:30',
    });

    expect(event).toMatchObject({ mealsCount: 1, isUncertain: false, amount: null, deletedAt: null });

    const list = await listEventsBetween(db, cat.id, '2026-01-01', '2026-01-31');
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe('food');
  });

  it('сортировка: дата DESC, время DESC без времени = самое позднее', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);

    for (const [date, time] of [
      ['2026-01-05', '08:00'],
      ['2026-01-05', null],
      ['2026-01-05', '20:00'],
      ['2026-01-04', '23:00'],
    ] as const) {
      await createEvent(db, { catId: cat.id, type: 'poop', eventDate: date, eventTime: time });
    }

    const list = await listEventsBetween(db, cat.id, '2026-01-01', '2026-01-31');
    const keys = list.map((e) => `${e.eventDate} ${e.eventTime ?? 'NULL'}`);
    expect(keys).toEqual(['2026-01-05 NULL', '2026-01-05 20:00', '2026-01-05 08:00', '2026-01-04 23:00']);
  });

  it('list не выходит за границы from/to и игнорирует soft-deleted', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);

    const inside = await createEvent(db, { catId: cat.id, type: 'pee', eventDate: '2026-01-10', eventTime: null });
    await createEvent(db, { catId: cat.id, type: 'pee', eventDate: '2026-02-20', eventTime: null });
    await softDeleteEvent(db, inside.id);

    const list = await listEventsBetween(db, cat.id, '2026-01-01', '2026-01-31');
    expect(list).toHaveLength(0);
  });

  it('hasDataBefore: true при данных раньше дня, false иначе', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);

    expect(await hasDataBefore(db, cat.id, '2026-01-10')).toBe(false);

    await createEvent(db, { catId: cat.id, type: 'poop', eventDate: '2026-01-05', eventTime: null });

    expect(await hasDataBefore(db, cat.id, '2026-01-10')).toBe(true);
    expect(await hasDataBefore(db, cat.id, '2026-01-05')).toBe(false);
  });

  it('hasDataBefore учитывает заметки', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);

    await createNote(db, { catId: cat.id, day: '2026-01-01', time: null, text: 'заметка' });

    expect(await hasDataBefore(db, cat.id, '2026-01-05')).toBe(true);
  });

  it('update перезаписывает поля', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);
    const feed = await createFeed(db, { name: 'Корм', kind: 'wet', unit: 'spoon' });
    const event = await createEvent(db, { catId: cat.id, type: 'food', eventDate: '2026-01-05', eventTime: null });

    await updateEvent(db, event.id, {
      catId: cat.id,
      type: 'food',
      eventDate: '2026-01-06',
      eventTime: '12:00',
      isUncertain: true,
      feedId: feed.id,
      amount: 2.5,
      mealsCount: 3,
    });

    const [updated] = await listEventsBetween(db, cat.id, '2026-01-01', '2026-01-31');
    expect(updated).toMatchObject({
      eventDate: '2026-01-06',
      eventTime: '12:00',
      isUncertain: true,
      feedId: feed.id,
      amount: 2.5,
      mealsCount: 3,
    });
  });
});

/* ---------- Notes ---------- */

describe('Notes', () => {
  it('create + list, сортировка как у событий', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);

    await createNote(db, { catId: cat.id, day: '2026-01-05', time: '10:00', text: 'утро' });
    await createNote(db, { catId: cat.id, day: '2026-01-05', time: null, text: 'без времени' });
    await createNote(db, { catId: cat.id, day: '2026-01-06', time: null, text: 'завтра' });

    const notes = await listNotesBetween(db, cat.id, '2026-01-01', '2026-01-31');
    expect(notes.map((n) => n.text)).toEqual(['завтра', 'без времени', 'утро']);
  });

  it('update и soft delete', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);
    const note = await createNote(db, { catId: cat.id, day: '2026-01-05', time: null, text: 'черновик' });

    await updateNote(db, note.id, { text: 'финал' });
    expect((await listNotesBetween(db, cat.id, '2026-01-01', '2026-01-31'))[0].text).toBe('финал');

    await softDeleteNote(db, note.id);
    expect(await listNotesBetween(db, cat.id, '2026-01-01', '2026-01-31')).toHaveLength(0);
  });
});

/* ---------- Weights ---------- */

describe('Weight entries', () => {
  it('add + list (measured_on DESC)', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);

    await addWeightEntry(db, cat.id, 4200, '2026-01-01');
    await addWeightEntry(db, cat.id, 4500, '2026-02-01');

    const list = await listWeightEntries(db, cat.id);
    expect(list.map((w) => w.weightGrams)).toEqual([4500, 4200]);
  });

  it('soft delete исключает запись', async () => {
    const db = await freshDb();
    const cat = await seedCat(db);
    const entry = await addWeightEntry(db, cat.id, 4200, '2026-01-01');

    await softDeleteWeightEntry(db, entry.id);

    expect(await listWeightEntries(db, cat.id)).toHaveLength(0);
  });
});

/* ---------- Meta ---------- */

describe('App meta', () => {
  it('set → get, upsert, delete', async () => {
    const db = await freshDb();

    expect(await getMeta(db, 'language')).toBeNull();

    await setMeta(db, 'language', 'ru');
    expect(await getMeta(db, 'language')).toBe('ru');

    await setMeta(db, 'language', 'en'); // upsert
    expect(await getMeta(db, 'language')).toBe('en');

    await deleteMeta(db, 'language');
    expect(await getMeta(db, 'language')).toBeNull();
  });
});

/* ---------- getDaySummaries ---------- */

describe('getDaySummaries', () => {
  async function seedEvents(db: TestDb): Promise<Cat> {
    const cat = await seedCat(db);
    const custom = await createFeed(db, { name: 'Влажный', kind: 'wet', unit: 'spoon' });

    // Стул ×2 (один без качества)
    await createEvent(db, { catId: cat.id, type: 'poop', eventDate: '2026-01-05', eventTime: '08:00', stoolQuality: 'normal' });
    await createEvent(db, { catId: cat.id, type: 'poop', eventDate: '2026-01-05', eventTime: '20:00' });

    // Пися ×1
    await createEvent(db, { catId: cat.id, type: 'pee', eventDate: '2026-01-05', eventTime: '09:00', peeVolume: 'high' });

    // Еда: preset wet (spoon, amount), custom wet (spoon, без amount), preset dry (gram, amount)
    await createEvent(db, { catId: cat.id, type: 'food', eventDate: '2026-01-05', eventTime: '08:30', feedId: SEED_FEED_IDS.wet, amount: 2 });
    await createEvent(db, { catId: cat.id, type: 'food', eventDate: '2026-01-05', eventTime: '13:00', feedId: custom.id });
    await createEvent(db, { catId: cat.id, type: 'food', eventDate: '2026-01-05', eventTime: '18:00', feedId: SEED_FEED_IDS.dry, amount: 150 });

    // Еда без feed_id — fallback на dry/gram
    await createEvent(db, { catId: cat.id, type: 'food', eventDate: '2026-01-06', eventTime: '08:00' });

    // Soft-deleted — не должен попасть в сводку
    const deleted = await createEvent(db, { catId: cat.id, type: 'poop', eventDate: '2026-01-05', eventTime: '21:00' });
    await softDeleteEvent(db, deleted.id);

    // Событие другого кота — не должно смешиваться
    const otherCat = await seedCat(db, 'Другой');
    await createEvent(db, { catId: otherCat.id, type: 'poop', eventDate: '2026-01-05', eventTime: null });

    return cat;
  }

  it('агрегирует счётчики, качества и объёмы по дням', async () => {
    const db = await freshDb();
    const cat = await seedEvents(db);

    const summaries = await getDaySummaries(db, cat.id, '2026-01-01', '2026-01-31');

    const day5 = summaries['2026-01-05'];
    expect(day5.poopCount).toBe(2);
    expect(day5.poopQualities).toEqual(['normal']); // второй — без качества
    expect(day5.peeCount).toBe(1);
    expect(day5.peeVolumes).toEqual(['high']);
    expect(day5.foodEvents).toBe(3);
  });

  it('группирует еду по kind+unit, считает суммы и пропуски amount', async () => {
    const db = await freshDb();
    const cat = await seedEvents(db);

    const summaries = await getDaySummaries(db, cat.id, '2026-01-01', '2026-01-31');

    const day5 = summaries['2026-01-05'];
    expect(day5.foodByKind).toEqual([
      { kind: 'wet', unit: 'spoon', totalAmount: 2, eventsWithoutAmount: 1 },
      { kind: 'dry', unit: 'gram', totalAmount: 150, eventsWithoutAmount: 0 },
    ]);
  });

  it('событие без feed_id попадает в dry/gram (fallback)', async () => {
    const db = await freshDb();
    const cat = await seedEvents(db);

    const summaries = await getDaySummaries(db, cat.id, '2026-01-01', '2026-01-31');

    const day6 = summaries['2026-01-06'];
    expect(day6.foodEvents).toBe(1);
    expect(day6.foodByKind).toEqual([
      { kind: 'dry', unit: 'gram', totalAmount: 0, eventsWithoutAmount: 1 },
    ]);
  });
});

/* ---------- localizePresetFeeds ---------- */

describe('localizePresetFeeds', () => {
  it('переименовывает пресеты при смене языка', async () => {
    const db = await freshDb(); // пресеты на ru

    await localizePresetFeeds(db, 'en');

    const feeds = await listFeeds(db);
    const wet = feeds.find((f) => f.id === SEED_FEED_IDS.wet);
    const dry = feeds.find((f) => f.id === SEED_FEED_IDS.dry);
    expect(wet?.name).toBe(PRESET_FEED_NAMES.wet.en);
    expect(dry?.name).toBe(PRESET_FEED_NAMES.dry.en);
  });

  it('НЕ перезаписывает имя, отредактированное пользователем', async () => {
    const db = await freshDb();
    const wet = await db.getFirstAsync<{ id: string }>('SELECT id FROM feeds WHERE kind = ?', 'wet');
    await updateFeed(db, wet!.id, { name: 'Мой любимый корм', kind: 'wet', unit: 'spoon' });

    await localizePresetFeeds(db, 'de');

    const feeds = await listFeeds(db);
    expect(feeds.find((f) => f.id === SEED_FEED_IDS.wet)?.name).toBe('Мой любимый корм');
    expect(feeds.find((f) => f.id === SEED_FEED_IDS.dry)?.name).toBe(PRESET_FEED_NAMES.dry.de);
  });

  it('распознаёт известное имя на любом из поддерживаемых языков', async () => {
    const db = await freshDb();
    // Ставим имя пресета на французском...
    const dry = await db.getFirstAsync<{ id: string }>('SELECT id FROM feeds WHERE kind = ?', 'dry');
    await updateFeed(db, dry!.id, { name: PRESET_FEED_NAMES.dry.fr, kind: 'dry', unit: 'gram' });

    // ...и меняем язык на итальянский — имя должно стать итальянским.
    await localizePresetFeeds(db, 'it');

    const feeds = await listFeeds(db);
    expect(feeds.find((f) => f.id === SEED_FEED_IDS.dry)?.name).toBe(PRESET_FEED_NAMES.dry.it);
  });

  it('не трогает непресетные корма с похожими именами', async () => {
    const db = await freshDb();
    const custom = await createFeed(db, { name: PRESET_FEED_NAMES.wet.ru, kind: 'wet', unit: 'spoon' });

    await localizePresetFeeds(db, 'en');

    const feeds: Feed[] = await listFeeds(db);
    expect(feeds.find((f) => f.id === custom.id)?.name).toBe(PRESET_FEED_NAMES.wet.ru);
  });
});
