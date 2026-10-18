import { migrateDbIfNeeded, SEED_FEED_IDS } from '@/db/migrate';
import { PRESET_FEED_NAMES } from '@/i18n';

import { createTestDb } from './test-db';

async function tableNames(db: Awaited<ReturnType<typeof createTestDb>>): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  );
  return rows.map((r) => r.name);
}

describe('migrateDbIfNeeded (свежая БД, v0 → v2)', () => {
  it('создаёт все таблицы и индексы', async () => {
    const db = await createTestDb();
    await migrateDbIfNeeded(db);

    const names = await tableNames(db);
    expect(names).toEqual(
      expect.arrayContaining(['app_meta', 'cats', 'events', 'feeds', 'notes', 'weight_entries'])
    );

    const indexes = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'`
    );
    const indexNames = indexes.map((r) => r.name);
    expect(indexNames).toEqual(expect.arrayContaining(['idx_events_cat_date', 'idx_notes_cat_day']));
  });

  it('сидит два preset-корма с текущим языком (ru)', async () => {
    const db = await createTestDb();
    await migrateDbIfNeeded(db);

    const feeds = await db.getAllAsync<{
      id: string;
      name: string;
      kind: string;
      unit: string;
      is_preset: number;
    }>('SELECT * FROM feeds ORDER BY kind');

    expect(feeds).toHaveLength(2);

    const wet = feeds.find((f) => f.kind === 'wet');
    const dry = feeds.find((f) => f.kind === 'dry');

    expect(wet).toMatchObject({
      id: SEED_FEED_IDS.wet,
      name: PRESET_FEED_NAMES.wet.ru,
      unit: 'spoon',
      is_preset: 1,
    });
    expect(dry).toMatchObject({
      id: SEED_FEED_IDS.dry,
      name: PRESET_FEED_NAMES.dry.ru,
      unit: 'gram',
      is_preset: 1,
    });
  });

  it('устанавливает user_version = 2', async () => {
    const db = await createTestDb();
    await migrateDbIfNeeded(db);

    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(2);
  });

  it('идемпотентен: повторный запуск — no-op', async () => {
    const db = await createTestDb();
    await migrateDbIfNeeded(db);
    await migrateDbIfNeeded(db);

    const feeds = await db.getAllAsync('SELECT * FROM feeds');
    expect(feeds).toHaveLength(2);

    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(2);
  });
});

describe('migrateDbIfNeeded (миграция v1 → v2)', () => {
  it('переносит day_notes → notes и удаляет старую таблицу', async () => {
    const db = await createTestDb();

    // Воссоздаём схему v1 вручную: day_notes вместо notes, user_version = 1.
    await db.execAsync(`
CREATE TABLE cats (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  sex TEXT NOT NULL DEFAULT 'unknown',
  birth_date TEXT,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE TABLE day_notes (
  id TEXT PRIMARY KEY NOT NULL,
  cat_id TEXT NOT NULL REFERENCES cats(id),
  day TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
INSERT INTO cats (id, name, color, created_at, updated_at)
  VALUES ('cat-1', 'Барсик', 'gray', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
INSERT INTO day_notes (id, cat_id, day, text, created_at, updated_at)
  VALUES ('note-1', 'cat-1', '2026-01-05', 'старая заметка', '2026-01-05T10:00:00.000Z', '2026-01-05T10:00:00.000Z');
PRAGMA user_version = 1;
`);

    await migrateDbIfNeeded(db);

    const names = await tableNames(db);
    expect(names).toContain('notes');
    expect(names).not.toContain('day_notes');

    const notes = await db.getAllAsync<{ id: string; day: string; note_time: string | null; text: string }>(
      'SELECT * FROM notes'
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      id: 'note-1',
      day: '2026-01-05',
      note_time: null,
      text: 'старая заметка',
    });

    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(2);
  });
});
