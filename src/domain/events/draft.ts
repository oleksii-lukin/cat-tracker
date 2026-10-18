import type { DayEvent, PeeVolume, StoolQuality } from '@/types/domain';

import { hasField } from './selectors';
import type { EventTypeDef } from './types';

/** Editable form values shared by the quick-add panel and the event sheet. */
export interface EventDraft {
  stoolQuality: StoolQuality;
  peeVolume: PeeVolume;
  feedId: string | null;
  amount: number;
  meals: number;
}

export const DEFAULT_DRAFT: EventDraft = {
  stoolQuality: 'normal',
  peeVolume: 'normal',
  feedId: null,
  amount: 0,
  meals: 1,
};

/** Build a draft from a stored event (defaults fill missing values). */
export function draftFromEvent(event: DayEvent): EventDraft {
  return {
    stoolQuality: event.stoolQuality ?? 'normal',
    peeVolume: event.peeVolume ?? 'normal',
    feedId: event.feedId,
    amount: event.amount ?? 0,
    meals: event.mealsCount,
  };
}

export interface DraftFields {
  stoolQuality: StoolQuality | null;
  peeVolume: PeeVolume | null;
  feedId: string | null;
  amount: number | null;
  mealsCount: number;
}

/**
 * Map a draft onto DayEvent fields: fields declared in the type def keep their
 * values, everything else is cleared — the single place that knows which field
 * belongs to which event type.
 */
export function draftToFields(def: EventTypeDef, draft: EventDraft): DraftFields {
  return {
    stoolQuality: hasField(def, 'stoolQuality') ? draft.stoolQuality : null,
    peeVolume: hasField(def, 'peeVolume') ? draft.peeVolume : null,
    feedId: hasField(def, 'feedId') ? draft.feedId : null,
    amount: hasField(def, 'amount') && draft.amount > 0 ? draft.amount : null,
    mealsCount: hasField(def, 'mealsCount') ? draft.meals : 1,
  };
}
