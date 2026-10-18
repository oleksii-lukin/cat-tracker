import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { createTestDb } from '@/db/__tests__/test-db';
import { migrateDbIfNeeded } from '@/db/migrate';
import { getMeta } from '@/db/repositories';
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

    expect(getIdsInOrder(result.current.quickActions)).toEqual(['pee', 'food', 'poop']);

    const raw = await getMeta(mockDb, QUICK_ACTIONS_META_KEY);
    const stored = JSON.parse(raw ?? '[]') as { id: string; order: number }[];
    expect([...stored].sort((a, b) => a.order - b.order).map((c) => c.id)).toEqual([
      'pee',
      'food',
      'poop',
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
