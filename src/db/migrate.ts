import type { SQLiteDatabase } from 'expo-sqlite';

import { nowIso } from '@/utils/id';

const DATABASE_VERSION = 2;

const SEED_FEED_WET = 'a0000000-0000-4000-8000-00000000feed1';
const SEED_FEED_DRY = 'a0000000-0000-4000-8000-00000000feed2';

export const SEED_FEED_IDS = { wet: SEED_FEED_WET, dry: SEED_FEED_DRY };

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
PRAGMA journal_mode = 'wal';
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cats (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  sex TEXT NOT NULL DEFAULT 'unknown',
  birth_date TEXT,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS weight_entries (
  id TEXT PRIMARY KEY NOT NULL,
  cat_id TEXT NOT NULL REFERENCES cats(id),
  weight_grams INTEGER NOT NULL,
  measured_on TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  unit TEXT NOT NULL,
  is_preset INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY NOT NULL,
  cat_id TEXT NOT NULL REFERENCES cats(id),
  type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  is_uncertain INTEGER NOT NULL DEFAULT 0,
  stool_quality TEXT,
  pee_volume TEXT,
  feed_id TEXT REFERENCES feeds(id),
  amount REAL,
  meals_count INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  photo_uri TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_cat_date ON events(cat_id, event_date);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  cat_id TEXT NOT NULL REFERENCES cats(id),
  day TEXT NOT NULL,
  note_time TEXT,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notes_cat_day ON notes(cat_id, day);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`);

    const ts = nowIso();
    await db.runAsync(
      `INSERT INTO feeds (id, name, kind, unit, is_preset, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`,
      SEED_FEED_WET, 'Мокрый корм (ложки)', 'wet', 'spoon', ts, ts
    );
    await db.runAsync(
      `INSERT INTO feeds (id, name, kind, unit, is_preset, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`,
      SEED_FEED_DRY, 'Сухой корм (граммы)', 'dry', 'gram', ts, ts
    );
    await db.runAsync(
      `INSERT INTO app_meta (key, value) VALUES ('seeded_at', ?)`,
      ts
    );
  }

  if (currentVersion === 1) {
    await db.execAsync(`
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  cat_id TEXT NOT NULL REFERENCES cats(id),
  day TEXT NOT NULL,
  note_time TEXT,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notes_cat_day ON notes(cat_id, day);
INSERT INTO notes (id, cat_id, day, note_time, text, created_at, updated_at, deleted_at)
  SELECT id, cat_id, day, NULL, text, created_at, updated_at, deleted_at FROM day_notes;
DROP TABLE IF EXISTS day_notes;
`);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
