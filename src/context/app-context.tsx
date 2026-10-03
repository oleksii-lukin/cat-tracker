import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { listCats, listFeeds } from '@/db/repositories';
import type { Cat, Feed } from '@/types/domain';

interface AppState {
  cats: Cat[];
  feeds: Feed[];
  currentCat: Cat | null;
  currentCatId: string | null;
  setCurrentCatId: (id: string) => void;
  focusDay: string | null;
  setFocusDay: (day: string | null) => void;
  refreshCats: () => Promise<void>;
  refreshFeeds: () => Promise<void>;
  bumpRevision: () => void;
  revision: number;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [cats, setCats] = useState<Cat[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [currentCatId, setCurrentCatId] = useState<string | null>(null);
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const refreshCats = useCallback(async () => {
    const list = await listCats(db);
    setCats(list);
    setCurrentCatId((prev) => {
      if (prev && list.some((c) => c.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
  }, [db]);

  const refreshFeeds = useCallback(async () => {
    const list = await listFeeds(db);
    setFeeds(list);
  }, [db]);

  const bumpRevision = useCallback(() => setRevision((r) => r + 1), []);

  useEffect(() => {
    refreshCats();
    refreshFeeds();
  }, [refreshCats, refreshFeeds]);

  const currentCat = useMemo(
    () => cats.find((c) => c.id === currentCatId) ?? cats[0] ?? null,
    [cats, currentCatId]
  );

  const value = useMemo<AppState>(
    () => ({
      cats,
      feeds,
      currentCat,
      currentCatId: currentCat?.id ?? null,
      setCurrentCatId,
      focusDay,
      setFocusDay,
      refreshCats,
      refreshFeeds,
      bumpRevision,
      revision,
    }),
    [cats, feeds, currentCat, focusDay, refreshCats, refreshFeeds, bumpRevision, revision]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
