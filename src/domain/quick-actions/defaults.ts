import type { QuickActionConfig } from './types';

/**
 * Default enabled set and order — matches the original hard-coded panel
 * (food, pee, poop).
 */
export const DEFAULT_QUICK_ACTIONS: QuickActionConfig[] = [
  { id: 'food', enabled: true, order: 0 },
  { id: 'pee', enabled: true, order: 1 },
  { id: 'poop', enabled: true, order: 2 },
  { id: 'hairball', enabled: true, order: 3 },
];
