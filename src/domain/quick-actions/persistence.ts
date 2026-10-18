import type { SQLiteDatabase } from 'expo-sqlite';

import { getMeta, setMeta } from '@/db/repositories';

import { DEFAULT_QUICK_ACTIONS } from './defaults';
import { QUICK_ACTIONS_META_KEY } from './registry';
import { mergeWithDefaults } from './selectors';
import type { QuickActionConfig } from './types';

/** Load the user's quick-actions config from app_meta, merged with defaults. */
export async function loadQuickActions(db: SQLiteDatabase): Promise<QuickActionConfig[]> {
  const raw = await getMeta(db, QUICK_ACTIONS_META_KEY);
  let stored: QuickActionConfig[] | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) stored = parsed as QuickActionConfig[];
    } catch {
      stored = null;
    }
  }
  return mergeWithDefaults(stored, DEFAULT_QUICK_ACTIONS);
}

/** Persist the config (normalized order) to app_meta. */
export async function saveQuickActions(
  db: SQLiteDatabase,
  config: QuickActionConfig[]
): Promise<void> {
  const normalized = [...config].sort((a, b) => a.order - b.order);
  await setMeta(db, QUICK_ACTIONS_META_KEY, JSON.stringify(normalized));
}
