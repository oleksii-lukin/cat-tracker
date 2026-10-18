import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { QuickBlocksSection } from '@/features/settings/components/QuickBlocksSection';
import type { QuickActionConfig } from '@/domain/quick-actions';

const config: QuickActionConfig[] = [
  { id: 'food', enabled: true, order: 0 },
  { id: 'pee', enabled: true, order: 1 },
  { id: 'poop', enabled: false, order: 2 },
];

describe('QuickBlocksSection', () => {
  it('рендерит название каждого блока из реестра', () => {
    const { getByText } = render(
      <QuickBlocksSection config={config} onToggle={() => {}} onMove={() => {}} />
    );

    expect(getByText('Поела')).toBeTruthy();
    expect(getByText('Пописяла')).toBeTruthy();
    expect(getByText('Покакала')).toBeTruthy();
  });

  it('вызывает onToggle с id по переключению', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <QuickBlocksSection config={config} onToggle={onToggle} onMove={() => {}} />
    );

    fireEvent(getByTestId('toggle-food'), 'valueChange', false);

    expect(onToggle).toHaveBeenCalledWith('food');
  });

  it('пропускает id, отсутствующие в реестре', () => {
    const badConfig: QuickActionConfig[] = [
      ...config,
      { id: 'ghost' as never, enabled: true, order: 3 },
    ];
    const { queryByText } = render(
      <QuickBlocksSection config={badConfig} onToggle={() => {}} onMove={() => {}} />
    );

    expect(queryByText('action.ghost')).toBeNull();
  });

  it('кнопка «вверх» задизейблен у первого элемента, «вниз» — у последнего', () => {
    const { getByTestId } = render(
      <QuickBlocksSection config={config} onToggle={() => {}} onMove={() => {}} />
    );

    const firstUp = getByTestId('move-up-food');
    const lastDown = getByTestId('move-down-poop');
    expect(firstUp.props.accessibilityState?.disabled).toBe(true);
    expect(lastDown.props.accessibilityState?.disabled).toBe(true);
    expect(getByTestId('move-down-food').props.accessibilityState?.disabled).toBe(false);
  });

  it('вызывает onMove с id и направлением', () => {
    const onMove = jest.fn();
    const { getByTestId } = render(
      <QuickBlocksSection config={config} onToggle={() => {}} onMove={onMove} />
    );

    fireEvent.press(getByTestId('move-down-food'));
    fireEvent.press(getByTestId('move-up-poop'));

    expect(onMove).toHaveBeenCalledWith('food', 1);
    expect(onMove).toHaveBeenCalledWith('poop', -1);
  });
});
