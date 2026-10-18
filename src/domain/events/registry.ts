import type { EventType } from '@/types/domain';

import type { EventTypeDef } from './types';

/**
 * Single source of truth for event types: label, visual identity, which
 * optional fields the type carries, and whether a photo is allowed.
 * To add a new event type: extend EventType in types/domain.ts, add an entry
 * here, add the label to every locale file, and (if it needs a custom field)
 * extend EventField + the field editors.
 */
export const EVENTS_REGISTRY: Record<EventType, EventTypeDef> = {
  poop: {
    id: 'poop',
    labelKey: 'action.poop',
    emoji: '🐾',
    main: '#D9933D',
    soft: '#FAF0DF',
    fields: ['stoolQuality'],
    supportsPhoto: true,
  },
  pee: {
    id: 'pee',
    labelKey: 'action.pee',
    emoji: '💧',
    main: '#2B8A8D',
    soft: '#E5F4F4',
    fields: ['peeVolume'],
    supportsPhoto: true,
  },
  food: {
    id: 'food',
    labelKey: 'action.food',
    emoji: '🍽',
    main: '#D96B43',
    soft: '#FBEBE4',
    fields: ['feedId', 'amount', 'mealsCount'],
    supportsPhoto: false,
  },
  hairball: {
    id: 'hairball',
    labelKey: 'action.hairball',
    emoji: '🧴',
    main: '#4C8B5B',
    soft: '#E7F3EA',
    fields: ['amount'],
    amountUnit: 'cm',
    supportsPhoto: false,
  },
};

export const ALL_EVENT_TYPES = Object.keys(EVENTS_REGISTRY) as EventType[];
