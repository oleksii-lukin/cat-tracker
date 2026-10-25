import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import '@/i18n';
import { StatsFilterSheet } from '@/features/stats/components/StatsFilterSheet';
import type { EventType } from '@/types/domain';

const TYPES: EventType[] = ['food', 'pee', 'poop', 'hairball'];

function renderSheet(overrides: Partial<React.ComponentProps<typeof StatsFilterSheet>> = {}) {
  const onToggle = jest.fn();
  const onClose = jest.fn();
  const props = {
    visible: true,
    types: TYPES,
    enabled: new Set<EventType>(['food', 'pee', 'poop', 'hairball']),
    sex: 'male' as const,
    onToggle,
    onClose,
    ...overrides,
  };
  const utils = render(<StatsFilterSheet {...props} />);
  return { ...utils, onToggle, onClose };
}

describe('StatsFilterSheet', () => {
  it('рендерит заголовок и все типы событий с формой по полу кота', () => {
    const { getByText } = renderSheet();

    expect(getByText('Показывать события')).toBeTruthy();
    expect(getByText('Поел')).toBeTruthy();
    expect(getByText('Пописял')).toBeTruthy();
    expect(getByText('Покакал')).toBeTruthy();
    expect(getByText('Паста')).toBeTruthy();
  });

  it('использует женскую форму для кошки', () => {
    const { getByText } = renderSheet({ sex: 'female' });

    expect(getByText('Поела')).toBeTruthy();
    expect(getByText('Покакала')).toBeTruthy();
  });

  it('показывает состояние Switch по набору включённых типов', () => {
    const { getByTestId } = renderSheet({ enabled: new Set<EventType>(['food']) });

    expect(getByTestId('stats-filter-food').props.value).toBe(true);
    expect(getByTestId('stats-filter-poop').props.value).toBe(false);
  });

  it('передаёт тоггл по типу события', () => {
    const { getByTestId, onToggle } = renderSheet();

    fireEvent(getByTestId('stats-filter-pee'), 'valueChange', false);

    expect(onToggle).toHaveBeenCalledWith('pee');
  });

  it('закрывается по кнопке ✕ и по тапу на фон', () => {
    const { getByTestId, onClose } = renderSheet();

    fireEvent(getByTestId('stats-filter-close'), 'press');
    fireEvent(getByTestId('stats-filter-backdrop'), 'press');

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('тихо не рендерит ничего при visible=false', () => {
    const { queryByTestId } = renderSheet({ visible: false });

    expect(queryByTestId('stats-filter-sheet')).toBeNull();
  });
});
