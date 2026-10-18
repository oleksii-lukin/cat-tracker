// Единый источник DDL и констант миграций.
// Используется в двух местах:
//  - src/db/migrate.ts (приложение);
//  - scripts/e2e-seed.mjs (генерация fixture-БД для e2e).
// Файл должен оставаться erasable-only TypeScript (без enum/namespace/параметровых
// свойств) — его импортирует нативный Node 24 через type stripping (.ts-импорты).

export const DATABASE_VERSION = 2;

export const SEED_FEED_WET = 'a0000000-0000-4000-8000-00000000feed1';
export const SEED_FEED_DRY = 'a0000000-0000-4000-8000-00000000feed2';

/** Схема свежей БД (v0 → текущая версия). */
export const SCHEMA_V0_SQL = `
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
`;

/** Миграция v1 → v2: day_notes → notes. */
export const MIGRATION_V1_TO_V2_SQL = `
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
`;
