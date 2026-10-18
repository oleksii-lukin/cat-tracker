// Генерация fixture-базы данных для e2e (Maestro).
// Схема берётся из src/db/schema.ts — того же источника, что и миграция приложения.
// Запуск из WSL:
//   node scripts/e2e-seed.mjs empty        > cat-tracker.db без котов (журнал пуст)
//   node scripts/e2e-seed.mjs week-history > кот «Тестя» + история за 7 дней
// Затем БД доставляется на эмулятор (см. README, «Сброс и seed состояния для e2e»).
//
// Время моделируется датами в строках, а не переводом часов устройства:
// все события вставляются относительно сегодняшнего дня (today-N).

import { writeFileSync } from 'node:fs';
import initSqlJs from 'sql.js';

import {
  DATABASE_VERSION,
  SCHEMA_V0_SQL,
  SEED_FEED_DRY,
  SEED_FEED_WET,
} from '../src/db/schema.ts';

const SCENARIO = process.argv[2] ?? 'empty';
const OUT = process.argv[3] ?? 'cat-tracker.db';

// Имена пресетов — как их засевает миграция на русском (см. src/i18n/ru.ts).
// Для e2e это нормально: флоу матчат русские тексты.
const PRESET_FEEDS = [
  { id: SEED_FEED_WET, name: 'Мокрый корм (ложки)', kind: 'wet', unit: 'spoon' },
  { id: SEED_FEED_DRY, name: 'Сухой корм (граммы)', kind: 'dry', unit: 'gram' },
];

const CAT = {
  id: 'seed-cat-1',
  name: 'Тестя',
  sex: 'female',
  birthDate: '2024-03-01',
  color: 'calico',
  createdAt: '2026-01-01T09:00:00.000Z',
};

function dayKey(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

let idSeq = 0;
function id(prefix) {
  idSeq += 1;
  return `${prefix}-${String(idSeq).padStart(4, '0')}`;
}

function insertCat(db, cat) {
  db.run(
    `INSERT INTO cats (id, name, sex, birth_date, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cat.id, cat.name, cat.sex, cat.birthDate, cat.color, cat.createdAt, cat.createdAt]
  );
}

function insertEvent(db, e) {
  db.run(
    `INSERT INTO events (id, cat_id, type, event_date, event_time, is_uncertain, stool_quality, pee_volume, feed_id, amount, meals_count, note, photo_uri, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    [
      e.id ?? id('ev'),
      e.catId,
      e.type,
      e.date,
      e.time ?? null,
      0,
      e.stoolQuality ?? null,
      e.peeVolume ?? null,
      e.feedId ?? null,
      e.amount ?? null,
      e.mealsCount ?? 1,
      e.note ?? null,
      `${e.date}T${e.time ?? '12:00'}:00.000Z`,
      `${e.date}T${e.time ?? '12:00'}:00.000Z`,
    ]
  );
}

function insertNote(db, n) {
  db.run(
    `INSERT INTO notes (id, cat_id, day, note_time, text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [n.id ?? id('note'), n.catId, n.day, n.time ?? null, n.text, `${n.day}T12:00:00.000Z`, `${n.day}T12:00:00.000Z`]
  );
}

function insertWeight(db, w) {
  db.run(
    `INSERT INTO weight_entries (id, cat_id, weight_grams, measured_on, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [w.id ?? id('w'), w.catId, w.grams, w.on, `${w.on}T09:00:00.000Z`, `${w.on}T09:00:00.000Z`]
  );
}

/** Кот «Тестя» с историей за 7 дней: еда/стул/пи каждый день + вес и заметка. */
function seedWeekHistory(db) {
  insertCat(db, CAT);

  for (let d = 6; d >= 0; d -= 1) {
    const date = daysAgo(d);
    insertEvent(db, { catId: CAT.id, type: 'food', date, time: '08:30', feedId: SEED_FEED_WET, amount: 2 });
    insertEvent(db, { catId: CAT.id, type: 'food', date, time: '19:00', feedId: SEED_FEED_DRY, amount: 150 });
    insertEvent(db, { catId: CAT.id, type: 'pee', date, time: '12:00', peeVolume: 'normal' });
    insertEvent(db, {
      catId: CAT.id,
      type: 'poop',
      date,
      time: '21:00',
      stoolQuality: d === 0 ? 'normal' : d === 3 ? 'hard' : 'normal',
    });
  }

  insertNote(db, { catId: CAT.id, day: daysAgo(2), time: '18:40', text: 'Играла, ела с аппетитом' });
  insertWeight(db, { catId: CAT.id, grams: 4100, on: daysAgo(6) });
  insertWeight(db, { catId: CAT.id, grams: 4150, on: daysAgo(1) });
}

const SCENARIOS = {
  /** Только схема + пресеты: журнал пуст, котов нет. */
  empty: () => {},
  'week-history': seedWeekHistory,
};

if (!(SCENARIO in SCENARIOS)) {
  console.error(`Неизвестный сценарий "${SCENARIO}". Доступные: ${Object.keys(SCENARIOS).join(', ')}`);
  process.exit(1);
}

const SQL = await initSqlJs();
const db = new SQL.Database();

db.exec(SCHEMA_V0_SQL);
const now = new Date().toISOString();
for (const f of PRESET_FEEDS) {
  db.run(
    `INSERT INTO feeds (id, name, kind, unit, is_preset, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [f.id, f.name, f.kind, f.unit, now, now]
  );
}
db.run(`INSERT INTO app_meta (key, value) VALUES ('seeded_at', ?)`, [now]);

SCENARIOS[SCENARIO](db);

db.exec(`PRAGMA user_version = ${DATABASE_VERSION}`);

writeFileSync(OUT, Buffer.from(db.export()));
db.close();

console.log(`Готово: ${OUT} (сценарий "${SCENARIO}")`);
