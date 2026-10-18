import { EVENTS_REGISTRY } from '@/domain/events';

import type { QuickActionDef } from './types';

/**
 * Quick actions available to the user — a subset of event types presented as
 * one-tap buttons. Visual identity and labels come from EVENTS_REGISTRY.
 * To make a new event type a quick action: add it to EVENTS_REGISTRY first,
 * then list its id here and in DEFAULT_QUICK_ACTIONS.
 */
export const QUICK_ACTIONS_REGISTRY = {
  food: EVENTS_REGISTRY.food,
  pee: EVENTS_REGISTRY.pee,
  poop: EVENTS_REGISTRY.poop,
} as const satisfies Record<string, QuickActionDef>;

/** Key in the app_meta table where the user config (JSON) is stored. */
export const QUICK_ACTIONS_META_KEY = 'quick_actions';
