import { migrateDbIfNeeded } from '@/db/migrate';
import { createTestDb } from '@/db/__tests__/test-db';
import { setMeta } from '@/db/repositories';
import { DEFAULT_QUICK_ACTIONS } from '@/domain/quick-actions/defaults';
import { loadQuickActions, saveQuickActions } from '@/domain/quick-actions/persistence';
import { QUICK_ACTIONS_META_KEY } from '@/domain/quick-actions/registry';
import { getIdsInOrder } from '@/domain/quick-actions/selectors';
import type { QuickActionConfig } from '@/domain/quick-actions/types';

import type { SQLiteDatabase } from 'expo-sqlite';

async function freshDb(): Promise<SQLiteDatabase> {
  const db = await createTestDb();
  await migrateDbIfNeeded(db);
  return db;
}

describe('loadQuickActions / saveQuickActions', () => {
  it('возвращает дефолты, когда в app_meta ничего не сохранено', async () => {
    const db = await freshDb();
    const config = await loadQuickActions(db);
    expect(config).toEqual(DEFAULT_QUICK_ACTIONS);
  });

  it('сохраняет и загружает конфиг', async () => {
    const db = await freshDb();
    const custom: QuickActionConfig[] = [
      { id: 'poop', enabled: true, order: 0 },
      { id: 'food', enabled: false, order: 1 },
      { id: 'pee', enabled: true, order: 2 },
      { id: 'hairball', enabled: false, order: 3 },
    ];
    await saveQuickActions(db, custom);

    const loaded = await loadQuickActions(db);
    expect(loaded).toEqual(custom);
    expect(getIdsInOrder(loaded)).toEqual(['poop', 'food', 'pee', 'hairball']);
  });

  it('переживает повреждённый JSON в app_meta', async () => {
    const db = await freshDb();
    await setMeta(db, QUICK_ACTIONS_META_KEY, '{broken json');

    const config = await loadQuickActions(db);
    expect(config).toEqual(DEFAULT_QUICK_ACTIONS);
  });

  it('переживает JSON не-массива в app_meta', async () => {
    const db = await freshDb();
    await setMeta(db, QUICK_ACTIONS_META_KEY, '{"id":"food"}');

    const config = await loadQuickActions(db);
    expect(config).toEqual(DEFAULT_QUICK_ACTIONS);
  });

  it('повторное сохранение перезаписывает предыдущий конфиг', async () => {
    const db = await freshDb();
    await saveQuickActions(db, [
      { id: 'food', enabled: false, order: 0 },
      { id: 'pee', enabled: true, order: 1 },
      { id: 'poop', enabled: true, order: 2 },
    ]);
    await saveQuickActions(db, DEFAULT_QUICK_ACTIONS);

    const loaded = await loadQuickActions(db);
    expect(loaded).toEqual(DEFAULT_QUICK_ACTIONS);
  });
});
