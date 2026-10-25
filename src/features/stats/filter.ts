import type { SQLiteDatabase } from 'expo-sqlite';

import { getMeta, setMeta } from '@/db/repositories';
import { ALL_EVENT_TYPES } from '@/domain/events';
import { getIdsInOrder, type QuickActionConfig } from '@/domain/quick-actions';
import type { DaySummary, EventType } from '@/types/domain';

/**
 * Per-cat key in app_meta. Bump the version when the stored shape changes so
 * old values are ignored instead of misread.
 */
const STATS_FILTER_META_PREFIX = 'stats_filter.v1:';

/** Stored shape: every known type as an explicit boolean. */
export type StoredStatsFilter = Partial<Record<EventType, boolean>>;

export function statsFilterMetaKey(catId: string): string {
  return `${STATS_FILTER_META_PREFIX}${catId}`;
}

/**
 * Default visible types: the quick blocks enabled right now. Kept separate
 * from the persisted filter so a filter only exists once the user edits it.
 */
export function defaultStatsFilter(quickActions: QuickActionConfig[]): Set<EventType> {
  const active = new Set<EventType>(quickActions.filter((c) => c.enabled).map((c) => c.id));
  return new Set(ALL_EVENT_TYPES.filter((type) => active.has(type)));
}

/** Types to list in the filter sheet: quick-block order first, unknown leftovers last. */
export function filterTypesInOrder(quickActions: QuickActionConfig[]): EventType[] {
  const known = new Set<string>(ALL_EVENT_TYPES);
  const ordered = getIdsInOrder(quickActions).filter((id) => known.has(id));
  for (const type of ALL_EVENT_TYPES) {
    if (!ordered.includes(type)) ordered.push(type);
  }
  return ordered;
}

/**
 * Load the stored filter for a cat. Missing, malformed or foreign values fall
 * back to `defaults`; a type absent from storage (e.g. a newly added event
 * type) also falls back to `defaults` instead of being hidden silently.
 */
export async function loadStatsFilter(
  db: SQLiteDatabase,
  catId: string,
  defaults: Set<EventType>
): Promise<Set<EventType>> {
  const raw = await getMeta(db, statsFilterMetaKey(catId));
  if (!raw) return new Set(defaults);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Set(defaults);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return new Set(defaults);
  }

  const record = parsed as Record<string, unknown>;
  const next = new Set<EventType>();
  for (const type of ALL_EVENT_TYPES) {
    const value = record[type];
    if (typeof value === 'boolean') {
      if (value) next.add(type);
    } else if (defaults.has(type)) {
      next.add(type);
    }
  }
  return next;
}

/** Persist the whole filter for a cat so an explicit "off" survives. */
export async function saveStatsFilter(
  db: SQLiteDatabase,
  catId: string,
  enabled: Set<EventType>
): Promise<void> {
  const record: StoredStatsFilter = {};
  for (const type of ALL_EVENT_TYPES) {
    record[type] = enabled.has(type);
  }
  await setMeta(db, statsFilterMetaKey(catId), JSON.stringify(record));
}

/** Whether the day has any events at all, regardless of the filter. */
export function hasAnyEvents(summary: DaySummary): boolean {
  return Object.values(summary.countsByType).some((count) => count > 0);
}
