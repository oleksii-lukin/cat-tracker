import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { QuickActionConfig } from '@/domain/quick-actions';
import type { EventType } from '@/types/domain';

import { defaultStatsFilter, filterTypesInOrder, loadStatsFilter, saveStatsFilter } from './filter';

interface UseStatsFilterResult {
  /** Types to offer in the sheet, in display order (all event types). */
  types: EventType[];
  /** Currently visible types for the active cat. */
  enabled: Set<EventType>;
  toggle: (type: EventType) => void;
}

/** Persisted filter for one cat, plus the defaults it was loaded against. */
interface LoadedFilter {
  catId: string;
  defaults: Set<EventType>;
  enabled: Set<EventType>;
}

/**
 * Visible event types in stats for the active cat.
 *
 * Without a stored value the filter follows the enabled quick blocks; once the
 * user edits it, the per-cat value wins and survives both app restarts and
 * later quick-block changes. Until a cat's value arrives (and whenever the
 * defaults change) the default set is shown, so there is no stale cross-cat
 * state and no synchronous setState inside the loading effect.
 */
export function useStatsFilter(
  catId: string | null,
  quickActions: QuickActionConfig[]
): UseStatsFilterResult {
  const db = useSQLiteContext();
  const defaults = useMemo(() => defaultStatsFilter(quickActions), [quickActions]);
  const types = useMemo(() => filterTypesInOrder(quickActions), [quickActions]);
  const [loaded, setLoaded] = useState<LoadedFilter | null>(null);

  const isCurrent = loaded !== null && loaded.catId === catId && loaded.defaults === defaults;
  const enabled = isCurrent ? loaded.enabled : defaults;

  // Latest visible set: toggles must not read a stale render closure.
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // A pending load must never overwrite an explicit choice.
  const loadId = useRef(0);

  useEffect(() => {
    if (!catId) return;
    const id = ++loadId.current;
    void loadStatsFilter(db, catId, defaults).then((next) => {
      if (id !== loadId.current) return;
      setLoaded({ catId, defaults, enabled: next });
    });
  }, [db, catId, defaults]);

  const toggle = useCallback(
    (type: EventType) => {
      if (!catId) return;
      const next = new Set(enabledRef.current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      enabledRef.current = next;
      loadId.current += 1;
      setLoaded({ catId, defaults, enabled: next });
      void saveStatsFilter(db, catId, next).catch(() => {
        // A failed write only loses the filter choice, not any data.
      });
    },
    [db, catId, defaults]
  );

  return { types, enabled, toggle };
}
