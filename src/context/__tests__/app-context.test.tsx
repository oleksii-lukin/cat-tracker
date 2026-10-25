import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Cat } from '@/types/domain';
import { createTestDb } from '@/db/__tests__/test-db';
import { migrateDbIfNeeded } from '@/db/migrate';
import { createCat, getMeta, softDeleteCat } from '@/db/repositories';
import { AppProvider, useApp } from '@/context/app-context';
import {
  DEFAULT_QUICK_ACTIONS,
  QUICK_ACTIONS_META_KEY,
  getIdsInOrder,
} from '@/domain/quick-actions';

let mockDb: SQLiteDatabase;

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

async function setup() {
  mockDb = await createTestDb();
  await migrateDbIfNeeded(mockDb);
  const utils = renderHook(() => useApp(), { wrapper });
  await waitFor(() => expect(utils.result.current.quickActions).toEqual(DEFAULT_QUICK_ACTIONS));
  return utils;
}

describe('AppContext: quickActions', () => {
  it('загружает дефолты при старте', async () => {
    const { result } = await setup();
    expect(result.current.quickActions).toEqual(DEFAULT_QUICK_ACTIONS);
  });

  it('toggle переключает enabled и сохраняет в app_meta', async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.toggleQuickAction('food');
    });

    expect(result.current.quickActions.find((c) => c.id === 'food')?.enabled).toBe(false);

    const raw = await getMeta(mockDb, QUICK_ACTIONS_META_KEY);
    const stored = JSON.parse(raw ?? '[]') as { id: string; enabled: boolean }[];
    expect(stored.find((c) => c.id === 'food')?.enabled).toBe(false);
  });

  it('move меняет порядок и сохраняет его', async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.moveQuickAction('food', 1);
    });

    expect(getIdsInOrder(result.current.quickActions)).toEqual(['pee', 'food', 'poop', 'hairball']);

    const raw = await getMeta(mockDb, QUICK_ACTIONS_META_KEY);
    const stored = JSON.parse(raw ?? '[]') as { id: string; order: number }[];
    expect([...stored].sort((a, b) => a.order - b.order).map((c) => c.id)).toEqual([
      'pee',
      'food',
      'poop',
      'hairball',
    ]);
  });

  it('reset возвращает дефолты и сохраняет их', async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.toggleQuickAction('poop');
      await result.current.moveQuickAction('food', 1);
      await result.current.resetQuickActions();
    });

    expect(result.current.quickActions).toEqual(DEFAULT_QUICK_ACTIONS);
    const raw = await getMeta(mockDb, QUICK_ACTIONS_META_KEY);
    const stored = JSON.parse(raw ?? '[]') as { id: string; enabled: boolean }[];
    expect(stored.every((c) => c.enabled)).toBe(true);
  });

  it('конфиг переживает перезапуск (повторный монтаж)', async () => {
    const first = await setup();
    await act(async () => {
      await first.result.current.toggleQuickAction('pee');
    });
    first.unmount();

    const second = renderHook(() => useApp(), { wrapper });
    await waitFor(() =>
      expect(second.result.current.quickActions.find((c) => c.id === 'pee')?.enabled).toBe(false)
    );
  });
});

/* ---------- Cats: выбор и фолбэк текущего кота ---------- */

/** Создаёт котов с детерминированным created_at (в одном тесте nowIso совпадает). */
async function setupWithCats(names: string[]) {
  mockDb = await createTestDb();
  await migrateDbIfNeeded(mockDb);

  const created: Cat[] = [];
  for (let i = 0; i < names.length; i += 1) {
    created.push(
      await createCat(mockDb, { name: names[i], sex: 'unknown', birthDate: null, color: 'gray' })
    );
    await mockDb.runAsync(
      `UPDATE cats SET created_at = ? WHERE id = ?`,
      `2026-01-0${i + 1}T00:00:00.000Z`,
      created[i].id
    );
  }

  const utils = renderHook(() => useApp(), { wrapper });
  await waitFor(() => expect(utils.result.current.cats).toHaveLength(names.length));
  return { utils, created };
}

describe('AppContext: cats', () => {
  it('загружает котов по created_at ASC и выбирает первого по умолчанию', async () => {
    const { utils } = await setupWithCats(['Тестя', 'Маркиз', 'Дуся']);

    expect(utils.result.current.cats.map((c) => c.name)).toEqual(['Тестя', 'Маркиз', 'Дуся']);
    expect(utils.result.current.currentCat?.name).toBe('Тестя');
    expect(utils.result.current.currentCatId).toBe(utils.result.current.cats[0].id);
  });

  it('setCurrentCatId переключает текущего кота', async () => {
    const { utils, created } = await setupWithCats(['Тестя', 'Маркиз']);

    await act(async () => {
      utils.result.current.setCurrentCatId(created[1].id);
    });

    expect(utils.result.current.currentCat?.id).toBe(created[1].id);
    expect(utils.result.current.currentCatId).toBe(created[1].id);
  });

  it('после удаления текущего кота — фолбэк на cats[0]', async () => {
    const { utils, created } = await setupWithCats(['Тестя', 'Маркиз']);

    await act(async () => {
      utils.result.current.setCurrentCatId(created[1].id);
    });
    expect(utils.result.current.currentCat?.name).toBe('Маркиз');

    await act(async () => {
      await softDeleteCat(mockDb, created[1].id);
      await utils.result.current.refreshCats();
    });

    expect(utils.result.current.cats.map((c) => c.name)).toEqual(['Тестя']);
    expect(utils.result.current.currentCat?.name).toBe('Тестя');
    expect(utils.result.current.currentCatId).toBe(created[0].id);
  });
});
