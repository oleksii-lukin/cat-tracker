import {
  ALL_EVENT_TYPES,
  DEFAULT_DRAFT,
  EVENTS_REGISTRY,
  draftFromEvent,
  draftToFields,
  getEventDef,
  hasField,
} from '@/domain/events';
import type { DayEvent } from '@/types/domain';

function makeEvent(overrides: Partial<DayEvent>): DayEvent {
  return {
    id: 'e1',
    catId: 'c1',
    type: 'poop',
    eventDate: '2026-01-01',
    eventTime: '10:00',
    isUncertain: false,
    stoolQuality: null,
    peeVolume: null,
    feedId: null,
    amount: null,
    mealsCount: 1,
    note: null,
    photoUri: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('EVENTS_REGISTRY', () => {
  it('покрывает все типы событий', () => {
    expect(ALL_EVENT_TYPES.sort()).toEqual(['food', 'pee', 'poop']);
    for (const type of ALL_EVENT_TYPES) {
      expect(EVENTS_REGISTRY[type]).toBeDefined();
      expect(EVENTS_REGISTRY[type].id).toBe(type);
    }
  });
});

describe('getEventDef', () => {
  it('возвращает деф для известного типа', () => {
    expect(getEventDef('poop').fields).toEqual(['stoolQuality']);
    expect(getEventDef('pee').supportsPhoto).toBe(true);
    expect(getEventDef('food').supportsPhoto).toBe(false);
  });

  it('возвращает нейтральный fallback для неизвестного типа', () => {
    const def = getEventDef('hairball');
    expect(def.fields).toEqual([]);
    expect(def.supportsPhoto).toBe(false);
    expect(def.labelKey).toBe('action.hairball');
  });
});

describe('hasField', () => {
  it('проверяет поля по дефу', () => {
    const poop = getEventDef('poop');
    expect(hasField(poop, 'stoolQuality')).toBe(true);
    expect(hasField(poop, 'peeVolume')).toBe(false);

    const food = getEventDef('food');
    expect(hasField(food, 'feedId')).toBe(true);
    expect(hasField(food, 'amount')).toBe(true);
    expect(hasField(food, 'mealsCount')).toBe(true);
    expect(hasField(food, 'stoolQuality')).toBe(false);
  });
});

describe('draftToFields', () => {
  it('оставляет поля, объявленные в типе, и обнуляет остальные', () => {
    const draft = { ...DEFAULT_DRAFT, stoolQuality: 'liquid' as const, amount: 5, meals: 2, feedId: 'f1' };
    const fields = draftToFields(getEventDef('poop'), draft);
    expect(fields).toEqual({
      stoolQuality: 'liquid',
      peeVolume: null,
      feedId: null,
      amount: null,
      mealsCount: 1,
    });
  });

  it('для food сохраняет корм/количество/приёмы, обнуляет стул', () => {
    const draft = { ...DEFAULT_DRAFT, stoolQuality: 'hard' as const, feedId: 'f1', amount: 2.5, meals: 3 };
    const fields = draftToFields(getEventDef('food'), draft);
    expect(fields).toEqual({
      stoolQuality: null,
      peeVolume: null,
      feedId: 'f1',
      amount: 2.5,
      mealsCount: 3,
    });
  });

  it('amount = 0 сохраняется как null', () => {
    const draft = { ...DEFAULT_DRAFT, feedId: 'f1', amount: 0 };
    const fields = draftToFields(getEventDef('food'), draft);
    expect(fields.amount).toBeNull();
  });

  it('для типа без полей всё обнуляется', () => {
    const draft = { ...DEFAULT_DRAFT, stoolQuality: 'liquid' as const, feedId: 'f1', amount: 7 };
    const fields = draftToFields(getEventDef('unknown-type'), draft);
    expect(fields).toEqual({
      stoolQuality: null,
      peeVolume: null,
      feedId: null,
      amount: null,
      mealsCount: 1,
    });
  });
});

describe('draftFromEvent', () => {
  it('восстанавливает draft из сохранённого события', () => {
    const event = makeEvent({ type: 'food', feedId: 'f1', amount: 6, mealsCount: 2 });
    expect(draftFromEvent(event)).toEqual({
      stoolQuality: 'normal',
      peeVolume: 'normal',
      feedId: 'f1',
      amount: 6,
      meals: 2,
    });
  });

  it('заполняет дефолтами отсутствующие значения', () => {
    const event = makeEvent({ type: 'poop', stoolQuality: null, amount: null });
    expect(draftFromEvent(event)).toEqual({
      stoolQuality: 'normal',
      peeVolume: 'normal',
      feedId: null,
      amount: 0,
      meals: 1,
    });
  });
});
