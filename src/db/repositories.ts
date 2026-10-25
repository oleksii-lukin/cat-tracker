import type { SQLiteDatabase } from 'expo-sqlite';

import { getEventDef, hasField } from '@/domain/events';
import { PRESET_FEED_NAMES, type Language } from '@/i18n';
import type {
  Cat,
  DayEvent,
  DaySummary,
  EventInput,
  Feed,
  FeedKind,
  FeedUnit,
  Note,
  PeeVolume,
  Sex,
  StoolQuality,
  WeightEntry,
} from '@/types/domain';
import { nowIso, uuid } from '@/utils/id';

import { PHOTOS_DIR_NAME } from './schema';

/* ---------- Cats ---------- */

interface CatRow {
  id: string;
  name: string;
  sex: string;
  birth_date: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapCat(row: CatRow): Cat {
  return {
    id: row.id,
    name: row.name,
    sex: row.sex as Sex,
    birthDate: row.birth_date,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function listCats(db: SQLiteDatabase): Promise<Cat[]> {
  const rows = await db.getAllAsync<CatRow>(
    `SELECT * FROM cats WHERE deleted_at IS NULL ORDER BY created_at ASC`
  );
  return rows.map(mapCat);
}

export async function createCat(
  db: SQLiteDatabase,
  input: { name: string; sex: Sex; birthDate: string | null; color: string }
): Promise<Cat> {
  const ts = nowIso();
  const id = uuid();
  await db.runAsync(
    `INSERT INTO cats (id, name, sex, birth_date, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, input.name, input.sex, input.birthDate, input.color, ts, ts
  );
  return {
    id,
    name: input.name,
    sex: input.sex,
    birthDate: input.birthDate,
    color: input.color,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
}

export async function updateCat(
  db: SQLiteDatabase,
  id: string,
  input: { name: string; sex: Sex; birthDate: string | null; color: string }
): Promise<void> {
  const ts = nowIso();
  await db.runAsync(
    `UPDATE cats SET name = ?, sex = ?, birth_date = ?, color = ?, updated_at = ? WHERE id = ?`,
    input.name, input.sex, input.birthDate, input.color, ts, id
  );
}

export async function softDeleteCat(db: SQLiteDatabase, id: string): Promise<void> {
  const ts = nowIso();
  await db.runAsync(`UPDATE cats SET deleted_at = ?, updated_at = ? WHERE id = ?`, ts, ts, id);
}

/* ---------- Weight entries ---------- */

interface WeightRow {
  id: string;
  cat_id: string;
  weight_grams: number;
  measured_on: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapWeight(row: WeightRow): WeightEntry {
  return {
    id: row.id,
    catId: row.cat_id,
    weightGrams: row.weight_grams,
    measuredOn: row.measured_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function listWeightEntries(db: SQLiteDatabase, catId: string): Promise<WeightEntry[]> {
  const rows = await db.getAllAsync<WeightRow>(
    `SELECT * FROM weight_entries WHERE cat_id = ? AND deleted_at IS NULL ORDER BY measured_on DESC, created_at DESC`,
    catId
  );
  return rows.map(mapWeight);
}

export async function addWeightEntry(
  db: SQLiteDatabase,
  catId: string,
  weightGrams: number,
  measuredOn: string
): Promise<WeightEntry> {
  const ts = nowIso();
  const id = uuid();
  await db.runAsync(
    `INSERT INTO weight_entries (id, cat_id, weight_grams, measured_on, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    id, catId, weightGrams, measuredOn, ts, ts
  );
  return {
    id,
    catId,
    weightGrams,
    measuredOn,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
}

export async function softDeleteWeightEntry(db: SQLiteDatabase, id: string): Promise<void> {
  const ts = nowIso();
  await db.runAsync(
    `UPDATE weight_entries SET deleted_at = ?, updated_at = ? WHERE id = ?`,
    ts, ts, id
  );
}

/* ---------- Feeds ---------- */

interface FeedRow {
  id: string;
  name: string;
  kind: string;
  unit: string;
  is_preset: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapFeed(row: FeedRow): Feed {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as Feed['kind'],
    unit: row.unit as Feed['unit'],
    isPreset: row.is_preset === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function listFeeds(db: SQLiteDatabase): Promise<Feed[]> {
  const rows = await db.getAllAsync<FeedRow>(
    `SELECT * FROM feeds WHERE deleted_at IS NULL ORDER BY is_preset DESC, name ASC`
  );
  return rows.map(mapFeed);
}

export async function createFeed(
  db: SQLiteDatabase,
  input: { name: string; kind: Feed['kind']; unit: Feed['unit'] }
): Promise<Feed> {
  const ts = nowIso();
  const id = uuid();
  await db.runAsync(
    `INSERT INTO feeds (id, name, kind, unit, is_preset, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)`,
    id, input.name, input.kind, input.unit, ts, ts
  );
  return {
    id,
    name: input.name,
    kind: input.kind,
    unit: input.unit,
    isPreset: false,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
}

export async function updateFeed(
  db: SQLiteDatabase,
  id: string,
  input: { name: string; kind: Feed['kind']; unit: Feed['unit'] }
): Promise<void> {
  const ts = nowIso();
  await db.runAsync(
    `UPDATE feeds SET name = ?, kind = ?, unit = ?, updated_at = ? WHERE id = ?`,
    input.name, input.kind, input.unit, ts, id
  );
}

export async function softDeleteFeed(db: SQLiteDatabase, id: string): Promise<void> {
  const ts = nowIso();
  await db.runAsync(`UPDATE feeds SET deleted_at = ?, updated_at = ? WHERE id = ?`, ts, ts, id);
}

/* ---------- Events ---------- */

interface EventRow {
  id: string;
  cat_id: string;
  type: string;
  event_date: string;
  event_time: string | null;
  is_uncertain: number;
  stool_quality: string | null;
  pee_volume: string | null;
  feed_id: string | null;
  amount: number | null;
  meals_count: number;
  note: string | null;
  photo_uri: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapEvent(row: EventRow): DayEvent {
  return {
    id: row.id,
    catId: row.cat_id,
    type: row.type as DayEvent['type'],
    eventDate: row.event_date,
    eventTime: row.event_time,
    isUncertain: row.is_uncertain === 1,
    stoolQuality: row.stool_quality as DayEvent['stoolQuality'],
    peeVolume: row.pee_volume as DayEvent['peeVolume'],
    feedId: row.feed_id,
    amount: row.amount,
    mealsCount: row.meals_count,
    note: row.note,
    photoUri: row.photo_uri,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function listEventsBetween(
  db: SQLiteDatabase,
  catId: string,
  fromDay: string,
  toDay: string
): Promise<DayEvent[]> {
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM events
     WHERE cat_id = ? AND event_date >= ? AND event_date <= ? AND deleted_at IS NULL
     ORDER BY event_date DESC, COALESCE(event_time, '99:99') DESC, created_at DESC`,
    catId, fromDay, toDay
  );
  return rows.map(mapEvent);
}

export async function hasDataBefore(
  db: SQLiteDatabase,
  catId: string,
  beforeDay: string
): Promise<boolean> {
  const row = await db.getFirstAsync<{ x: number }>(
    `SELECT 1 AS x FROM events WHERE cat_id = ? AND event_date < ? AND deleted_at IS NULL
     UNION ALL
     SELECT 1 AS x FROM notes WHERE cat_id = ? AND day < ? AND deleted_at IS NULL
     LIMIT 1`,
    catId, beforeDay, catId, beforeDay
  );
  return row != null;
}

export async function createEvent(db: SQLiteDatabase, input: EventInput): Promise<DayEvent> {
  const ts = nowIso();
  const id = uuid();
  await db.runAsync(
    `INSERT INTO events (
       id, cat_id, type, event_date, event_time, is_uncertain,
       stool_quality, pee_volume, feed_id, amount, meals_count, note, photo_uri,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.catId,
    input.type,
    input.eventDate,
    input.eventTime,
    input.isUncertain ? 1 : 0,
    input.stoolQuality ?? null,
    input.peeVolume ?? null,
    input.feedId ?? null,
    input.amount ?? null,
    input.mealsCount ?? 1,
    input.note ?? null,
    input.photoUri ?? null,
    ts,
    ts
  );
  return {
    id,
    catId: input.catId,
    type: input.type,
    eventDate: input.eventDate,
    eventTime: input.eventTime,
    isUncertain: input.isUncertain ?? false,
    stoolQuality: input.stoolQuality ?? null,
    peeVolume: input.peeVolume ?? null,
    feedId: input.feedId ?? null,
    amount: input.amount ?? null,
    mealsCount: input.mealsCount ?? 1,
    note: input.note ?? null,
    photoUri: input.photoUri ?? null,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
}

export async function updateEvent(
  db: SQLiteDatabase,
  id: string,
  input: EventInput
): Promise<void> {
  const ts = nowIso();
  await db.runAsync(
    `UPDATE events SET
       type = ?, event_date = ?, event_time = ?, is_uncertain = ?,
       stool_quality = ?, pee_volume = ?, feed_id = ?, amount = ?,
       meals_count = ?, note = ?, photo_uri = ?, updated_at = ?
     WHERE id = ?`,
    input.type,
    input.eventDate,
    input.eventTime,
    input.isUncertain ? 1 : 0,
    input.stoolQuality ?? null,
    input.peeVolume ?? null,
    input.feedId ?? null,
    input.amount ?? null,
    input.mealsCount ?? 1,
    input.note ?? null,
    input.photoUri ?? null,
    ts,
    id
  );
}

export async function softDeleteEvent(db: SQLiteDatabase, id: string): Promise<void> {
  const ts = nowIso();
  await db.runAsync(`UPDATE events SET deleted_at = ?, updated_at = ? WHERE id = ?`, ts, ts, id);
}

/* ---------- Notes ---------- */

interface NoteRow {
  id: string;
  cat_id: string;
  day: string;
  note_time: string | null;
  text: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    catId: row.cat_id,
    day: row.day,
    time: row.note_time,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function createNote(
  db: SQLiteDatabase,
  input: { catId: string; day: string; time: string | null; text: string }
): Promise<Note> {
  const ts = nowIso();
  const id = uuid();
  await db.runAsync(
    `INSERT INTO notes (id, cat_id, day, note_time, text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, input.catId, input.day, input.time, input.text, ts, ts
  );
  return {
    id,
    catId: input.catId,
    day: input.day,
    time: input.time,
    text: input.text,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
}

export async function listNotesBetween(
  db: SQLiteDatabase,
  catId: string,
  fromDay: string,
  toDay: string
): Promise<Note[]> {
  const rows = await db.getAllAsync<NoteRow>(
    `SELECT * FROM notes
     WHERE cat_id = ? AND day >= ? AND day <= ? AND deleted_at IS NULL
     ORDER BY day DESC, COALESCE(note_time, '99:99') DESC, created_at DESC`,
    catId, fromDay, toDay
  );
  return rows.map(mapNote);
}

export async function updateNote(
  db: SQLiteDatabase,
  id: string,
  input: { text: string }
): Promise<void> {
  const ts = nowIso();
  await db.runAsync(
    `UPDATE notes SET text = ?, updated_at = ? WHERE id = ?`,
    input.text, ts, id
  );
}

export async function softDeleteNote(db: SQLiteDatabase, id: string): Promise<void> {
  const ts = nowIso();
  await db.runAsync(`UPDATE notes SET deleted_at = ?, updated_at = ? WHERE id = ?`, ts, ts, id);
}

/* ---------- Stats ---------- */

export async function getDaySummaries(
  db: SQLiteDatabase,
  catId: string,
  fromDay: string,
  toDay: string
): Promise<Record<string, DaySummary>> {
  const events = await db.getAllAsync<{
    event_date: string;
    type: string;
    stool_quality: string | null;
    pee_volume: string | null;
    feed_id: string | null;
    amount: number | null;
    meals_count: number | null;
  }>(
    `SELECT event_date, type, stool_quality, pee_volume, feed_id, amount, meals_count
     FROM events
     WHERE cat_id = ? AND event_date >= ? AND event_date <= ? AND deleted_at IS NULL`,
    catId, fromDay, toDay
  );
  const feeds = await db.getAllAsync<{ id: string; kind: string; unit: string }>(
    `SELECT id, kind, unit FROM feeds WHERE deleted_at IS NULL`
  );
  const feedMap = new Map(feeds.map((f) => [f.id, { kind: f.kind as FeedKind, unit: f.unit as FeedUnit }]));

  const result: Record<string, DaySummary> = {};
  const ensure = (day: string): DaySummary => {
    if (!result[day]) {
      result[day] = {
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
    return result[day];
  };

  for (const row of events) {
    const summary = ensure(row.event_date);
    summary.countsByType[row.type] = (summary.countsByType[row.type] ?? 0) + 1;
    if (row.type === 'poop') {
      summary.poopCount += 1;
      if (row.stool_quality) summary.poopQualities.push(row.stool_quality as StoolQuality);
    } else if (row.type === 'pee') {
      summary.peeCount += 1;
      if (row.pee_volume) summary.peeVolumes.push(row.pee_volume as PeeVolume);
    } else if (row.type === 'food') {
      summary.foodEvents += 1;
      const feed = row.feed_id ? feedMap.get(row.feed_id) : null;
      const kind = feed?.kind ?? 'dry';
      const unit = feed?.unit ?? 'gram';
      let bucket = summary.foodByKind.find((b) => b.kind === kind && b.unit === unit);
      if (!bucket) {
        bucket = { kind, unit, totalAmount: 0, eventsWithoutAmount: 0 };
        summary.foodByKind.push(bucket);
      }
      if (row.amount != null) bucket.totalAmount += row.amount;
      else bucket.eventsWithoutAmount += 1;
    } else {
      // Type-level amount (not feed-tied), e.g. hairball paste in cm:
      // any type declaring the amount field is aggregated generically.
      const def = getEventDef(row.type);
      if (hasField(def, 'amount')) {
        let bucket = summary.amountsByType[row.type];
        if (!bucket) {
          bucket = { totalAmount: 0, eventsWithoutAmount: 0 };
          summary.amountsByType[row.type] = bucket;
        }
        if (row.amount != null) bucket.totalAmount += row.amount;
        else bucket.eventsWithoutAmount += 1;
      }
    }
  }
  return result;
}

/* ---------- Photos ---------- */

export async function savePhotoAsset(sourceUri: string, eventId: string): Promise<string> {
  const { Directory, File, Paths } = await import('expo-file-system');
  const photosDir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!photosDir.exists) {
    photosDir.create();
  }
  const src = new File(sourceUri);
  const dest = new File(photosDir, `${eventId}.jpg`);
  if (dest.exists) {
    dest.delete();
  }
  await src.copy(dest);
  return dest.uri;
}

/* ---------- App meta ---------- */

export async function getMeta(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = ?`,
    key
  );
  return row?.value ?? null;
}

export async function setMeta(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key, value
  );
}

export async function deleteMeta(db: SQLiteDatabase, key: string): Promise<void> {
  await db.runAsync(`DELETE FROM app_meta WHERE key = ?`, key);
}

/* ---------- Localization of preset data ---------- */

/**
 * Renames preset feeds to the given language, but only when the current name
 * matches a known preset name on any supported language — so a name edited
 * by the user is never overwritten.
 */
export async function localizePresetFeeds(db: SQLiteDatabase, lang: Language): Promise<void> {
  const ts = nowIso();
  for (const kind of ['wet', 'dry'] as const) {
    const knownNames = Object.values(PRESET_FEED_NAMES[kind]);
    const targetName = PRESET_FEED_NAMES[kind][lang];
    const placeholders = knownNames.map(() => '?').join(', ');
    await db.runAsync(
      `UPDATE feeds SET name = ?, updated_at = ?
       WHERE is_preset = 1 AND deleted_at IS NULL AND kind = ? AND name IN (${placeholders})`,
      targetName, ts, kind, ...knownNames
    );
  }
}
