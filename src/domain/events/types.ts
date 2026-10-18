import type { EventType } from '@/types/domain';

/** Optional DayEvent fields an event type can carry. */
export type EventField = 'stoolQuality' | 'peeVolume' | 'feedId' | 'amount' | 'mealsCount';

export interface EventTypeDef {
  id: EventType;
  /** i18n key for the event label (e.g. "action.poop"). */
  labelKey: string;
  /** Emoji glyph shown on cards/buttons. */
  emoji: string;
  /** Accent color for the event family. */
  main: string;
  /** Soft (background) color for the event family. */
  soft: string;
  /** Which optional fields of DayEvent this type uses. */
  fields: readonly EventField[];
  /** Unit for the amount field when it's not tied to a feed (e.g. 'cm' for paste). */
  amountUnit?: string;
  /** Whether a photo can be attached to this type. */
  supportsPhoto: boolean;
}
