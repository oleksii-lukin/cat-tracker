import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import '@/i18n';
import { EventFieldRenderer } from '@/components/event-fields';
import { DEFAULT_DRAFT, type EventDraft } from '@/domain/events';
import type { Feed } from '@/types/domain';

const feeds: Feed[] = [
  {
    id: 'feed-1',
    name: 'Мокрый корм (ложки)',
    kind: 'wet',
    unit: 'spoon',
    isPreset: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
  },
];

function ctx(overrides: Partial<{ draft: EventDraft; patch: jest.Mock }> = {}) {
  return {
    draft: overrides.draft ?? DEFAULT_DRAFT,
    patch: overrides.patch ?? jest.fn(),
    feeds,
    main: '#D9933D',
    soft: '#FAF0DF',
  };
}

describe('EventFieldRenderer', () => {
  it('stoolQuality: рендерит чипсы стула и вызывает patch', () => {
    const patch = jest.fn();
    const { getByText } = render(
      <EventFieldRenderer field="stoolQuality" ctx={ctx({ patch })} />
    );

    expect(getByText('Стул')).toBeTruthy();
    fireEvent.press(getByText('Жидкий'));
    expect(patch).toHaveBeenCalledWith({ stoolQuality: 'liquid' });
  });

  it('peeVolume: рендерит варианты объёма и вызывает patch', () => {
    const patch = jest.fn();
    const { getByText } = render(
      <EventFieldRenderer field="peeVolume" ctx={ctx({ patch })} />
    );

    expect(getByText('Объём')).toBeTruthy();
    fireEvent.press(getByText('Много'));
    expect(patch).toHaveBeenCalledWith({ peeVolume: 'high' });
  });

  it('feedId: рендерит список кормов и вызывает patch', () => {
    const patch = jest.fn();
    const { getByText } = render(
      <EventFieldRenderer field="feedId" ctx={ctx({ patch })} />
    );

    expect(getByText('Корм')).toBeTruthy();
    fireEvent.press(getByText('Мокрый корм (ложки)'));
    expect(patch).toHaveBeenCalledWith({ feedId: 'feed-1' });
  });

  it('amount: подставляет единицу из выбранного корма', () => {
    const draft: EventDraft = { ...DEFAULT_DRAFT, feedId: 'feed-1' };
    const { getByText } = render(
      <EventFieldRenderer field="amount" ctx={ctx({ draft })} />
    );

    expect(getByText('Количество (лож.)')).toBeTruthy();
  });

  it('mealsCount: рендерит счётчик приёмов и вызывает patch', () => {
    const patch = jest.fn();
    const { getByText } = render(
      <EventFieldRenderer field="mealsCount" ctx={ctx({ patch })} />
    );

    expect(getByText('Приёмов')).toBeTruthy();
  });
});
