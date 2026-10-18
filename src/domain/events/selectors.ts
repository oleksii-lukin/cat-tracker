import type { EventType } from '@/types/domain';

import { EVENTS_REGISTRY } from './registry';
import type { EventField, EventTypeDef } from './types';

/**
 * Look up an event type def. Unknown types (e.g. rows written by a newer app
 * version) get a neutral fallback instead of crashing.
 */
export function getEventDef(type: EventType | string): EventTypeDef {
  const def = (EVENTS_REGISTRY as Record<string, EventTypeDef | undefined>)[type];
  if (def) return def;
  return {
    id: type as EventType,
    labelKey: `action.${type}`,
    emoji: '❓',
    main: '#8A726A',
    soft: '#F0E7DD',
    fields: [],
    supportsPhoto: false,
  };
}

/** Whether the event type carries the given optional field. */
export function hasField(def: EventTypeDef, field: EventField): boolean {
  return def.fields.includes(field);
}
