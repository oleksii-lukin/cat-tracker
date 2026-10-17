import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { listCats, listFeeds, getMeta, setMeta, deleteMeta, localizePresetFeeds } from '@/db/repositories';
import i18n, { getDeviceLanguage, LANGUAGE_AUTO, SUPPORTED_LANGUAGES, type Language, type LanguagePref } from '@/i18n';
import type { Cat, Feed } from '@/types/domain';

const LANGUAGE_META_KEY = 'language';

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
  languagePref: LanguagePref;
  setLanguage: (pref: LanguagePref) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [cats, setCats] = useState<Cat[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [currentCatId, setCurrentCatId] = useState<string | null>(null);
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [languagePref, setLanguagePrefState] = useState<LanguagePref>(LANGUAGE_AUTO);

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

  const applyLanguage = useCallback(
    async (pref: LanguagePref) => {
      const next: Language = pref === LANGUAGE_AUTO ? getDeviceLanguage() : pref;
      await i18n.changeLanguage(next);
      await localizePresetFeeds(db, next);
      await refreshFeeds();
    },
    [db, refreshFeeds]
  );

  useEffect(() => {
    (async () => {
      const saved = await getMeta(db, LANGUAGE_META_KEY);
      const pref: LanguagePref =
        saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)
          ? (saved as Language)
          : LANGUAGE_AUTO;
      setLanguagePrefState(pref);
      await applyLanguage(pref);
    })();
  }, [db, applyLanguage]);

  // On Android the device language can change while the app is running:
  // re-read it when returning to the foreground while in "auto" mode.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && languagePref === LANGUAGE_AUTO) {
        const device = getDeviceLanguage();
        if (device !== i18n.language) {
          void applyLanguage(LANGUAGE_AUTO);
        }
      }
    });
    return () => sub.remove();
  }, [languagePref, applyLanguage]);

  const setLanguage = useCallback(
    async (pref: LanguagePref) => {
      if (pref === LANGUAGE_AUTO) {
        await deleteMeta(db, LANGUAGE_META_KEY);
      } else {
        await setMeta(db, LANGUAGE_META_KEY, pref);
      }
      setLanguagePrefState(pref);
      await applyLanguage(pref);
    },
    [db, applyLanguage]
  );

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
      languagePref,
      setLanguage,
    }),
    [cats, feeds, currentCat, focusDay, setFocusDay, refreshCats, refreshFeeds, bumpRevision, revision, languagePref, setLanguage]
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
