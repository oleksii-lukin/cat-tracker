import type { SQLiteDatabase } from 'expo-sqlite';

import i18n from '@/i18n';
import { nowIso } from '@/utils/id';

import {
  DATABASE_VERSION,
  MIGRATION_V1_TO_V2_SQL,
  SCHEMA_V0_SQL,
  SEED_FEED_DRY,
  SEED_FEED_WET,
} from './schema';

export const SEED_FEED_IDS = { wet: SEED_FEED_WET, dry: SEED_FEED_DRY };

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(SCHEMA_V0_SQL);

    const ts = nowIso();
    await db.runAsync(
      `INSERT INTO feeds (id, name, kind, unit, is_preset, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`,
      SEED_FEED_WET, i18n.t('feed.wetName'), 'wet', 'spoon', ts, ts
    );
    await db.runAsync(
      `INSERT INTO feeds (id, name, kind, unit, is_preset, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`,
      SEED_FEED_DRY, i18n.t('feed.dryName'), 'dry', 'gram', ts, ts
    );
    await db.runAsync(
      `INSERT INTO app_meta (key, value) VALUES ('seeded_at', ?)`,
      ts
    );
  }

  if (currentVersion === 1) {
    await db.execAsync(MIGRATION_V1_TO_V2_SQL);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
