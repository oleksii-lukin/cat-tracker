import type { QuickActionConfig, QuickActionDef, QuickActionId } from './types';

/**
 * Merge stored config with defaults: every default id must exist in the result
 * (new ids added by app updates appear automatically); unknown stored ids are
 * kept so user data is never silently dropped.
 */
export function mergeWithDefaults(
  stored: QuickActionConfig[] | null | undefined,
  defaults: QuickActionConfig[]
): QuickActionConfig[] {
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return defaults.map((d) => ({ ...d }));
  }
  const byId = new Map(stored.map((s) => [s.id, s]));
  const result: QuickActionConfig[] = [];
  for (const d of defaults) {
    const s = byId.get(d.id);
    result.push(s ? { ...s } : { ...d });
  }
  for (const s of stored) {
    if (!defaults.some((d) => d.id === s.id)) {
      result.push({ id: s.id, enabled: s.enabled, order: s.order });
    }
  }
  result.sort((a, b) => a.order - b.order);
  return result;
}

/** Enabled defs in the user's preferred order. Ids missing from the registry are skipped. */
export function getEnabledSorted(
  registry: Record<string, QuickActionDef>,
  config: QuickActionConfig[]
): QuickActionDef[] {
  const sorted = [...config].sort((a, b) => a.order - b.order);
  const out: QuickActionDef[] = [];
  for (const c of sorted) {
    if (!c.enabled) continue;
    const def = registry[c.id];
    if (def) out.push(def);
  }
  return out;
}

/** Ids in the user's preferred order (regardless of enabled). */
export function getIdsInOrder(config: QuickActionConfig[]): QuickActionId[] {
  return [...config].sort((a, b) => a.order - b.order).map((c) => c.id);
}

/** Move an item up/down in the list, swapping order values with the neighbour. */
export function moveInList(
  config: QuickActionConfig[],
  id: QuickActionId,
  dir: -1 | 1
): QuickActionConfig[] {
  const sorted = [...config].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((c) => c.id === id);
  const swap = idx + dir;
  if (idx < 0 || swap < 0 || swap >= sorted.length) return config;
  const a = sorted[idx];
  const b = sorted[swap];
  return sorted.map((c, i) => {
    if (i === idx) return { ...c, order: b.order };
    if (i === swap) return { ...c, order: a.order };
    return c;
  });
}
