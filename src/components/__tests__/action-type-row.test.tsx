import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import '@/i18n';
import { ActionTypeRow, computeActionColumns } from '@/components/action-type-row';
import type { EventType } from '@/types/domain';

const TYPES: EventType[] = ['food', 'pee', 'poop', 'hairball'];

function renderRow(active: EventType | null = null) {
  return render(
    <ActionTypeRow
      types={TYPES}
      active={active}
      onSelect={jest.fn()}
      sex="unknown"
      size="md"
      testIDPrefix="quickadd"
      horizontalInset={60}
    />
  );
}

function buttonStyle(
  query: ReturnType<typeof renderRow>,
  type: EventType
) {
  return StyleSheet.flatten(query.getByTestId(`quickadd-${type}`).props.style);
}

describe('computeActionColumns', () => {
  it('оставляет все кнопки в один ряд, пока ширина достаточная', () => {
    expect(computeActionColumns(300, 4, 64)).toBe(4);
    expect(computeActionColumns(300, 3, 64)).toBe(3);
    expect(computeActionColumns(300, 1, 64)).toBe(1);
  });

  it('уменьшает число колонок вдвое для сбалансированной сетки', () => {
    expect(computeActionColumns(300, 4, 96)).toBe(2);
    expect(computeActionColumns(260, 4, 64)).toBe(2);
    expect(computeActionColumns(200, 3, 96)).toBe(2);
  });

  it('не уходит ниже одной колонки', () => {
    expect(computeActionColumns(120, 4, 64)).toBe(1);
  });
});

describe('ActionTypeRow', () => {
  it('рендерит кнопку на каждый тип с нужными testID', () => {
    const q = renderRow();

    expect(q.getByTestId('quickadd-row')).toBeTruthy();
    expect(q.getByTestId('quickadd-food')).toBeTruthy();
    expect(q.getByTestId('quickadd-pee')).toBeTruthy();
    expect(q.getByTestId('quickadd-poop')).toBeTruthy();
    expect(q.getByTestId('quickadd-hairball')).toBeTruthy();
  });

  it('подписывает кнопки по переданному полу', () => {
    const q = renderRow();

    expect(q.getByText('Поел(а)')).toBeTruthy();
    expect(q.getByText('Пописял(а)')).toBeTruthy();
    expect(q.getByText('Покакал(а)')).toBeTruthy();
  });

  it('сжимает текст одной строкой вместо переноса', () => {
    const q = renderRow();
    const label = q.getByText('Покакал(а)');

    expect(label.props.numberOfLines).toBe(1);
    expect(label.props.adjustsFontSizeToFit).toBe(true);
    expect(label.props.minimumFontScale).toBe(0.8);
    expect(label.props.maxFontSizeMultiplier).toBe(1.5);
  });

  it('держит рамку активной и неактивной кнопки одинаковой ширины', () => {
    const q = renderRow('poop');
    const inactive = buttonStyle(q, 'food');
    const active = buttonStyle(q, 'poop');

    expect(inactive.borderWidth).toBe(2);
    expect(active.borderWidth).toBe(2);
    expect(inactive.borderColor).toBe('transparent');
    expect(active.borderColor).toBe('#D9933D');
  });

  it('в состоянии по умолчанию складывает иконку над подписью', () => {
    const q = renderRow();

    expect(buttonStyle(q, 'food').flexDirection).toBeUndefined();
    expect(buttonStyle(q, 'food').minHeight).toBeUndefined();
  });

  it('переводит кнопки в горизонтальную раскладку, когда ряд не влезает', () => {
    const q = renderRow();
    fireEvent(q.getByTestId('quickadd-row'), 'layout', {
      nativeEvent: { layout: { width: 250, height: 40, x: 0, y: 0 } },
    });

    const food = buttonStyle(q, 'food');
    expect(food.flexDirection).toBe('row');
    expect(food.minHeight).toBe(48);
    expect(food.justifyContent).toBe('center');
    // 2 колонки: по 121dp на кнопку при ряде 250dp и зазоре 8dp.
    expect(food.flexBasis).toBe(121);
    // Подпись в строке не должна растягивать кнопку.
    expect(
      StyleSheet.flatten(q.getByText('Покакал(а)').props.style).marginTop
    ).toBe(0);
  });

  it('возвращает колоночную раскладку после расширения ряда', () => {
    const q = renderRow();
    fireEvent(q.getByTestId('quickadd-row'), 'layout', {
      nativeEvent: { layout: { width: 700, height: 40, x: 0, y: 0 } },
    });

    const food = buttonStyle(q, 'food');
    expect(food.flexDirection).toBeUndefined();
    expect(food.minHeight).toBeUndefined();
  });

  it('ничего не рендерит без включённых типов', () => {
    const q = render(
      <ActionTypeRow
        types={[]}
        active={null}
        onSelect={jest.fn()}
        testIDPrefix="quickadd"
        horizontalInset={60}
      />
    );

    expect(q.queryByTestId('quickadd-row')).toBeNull();
  });
});
