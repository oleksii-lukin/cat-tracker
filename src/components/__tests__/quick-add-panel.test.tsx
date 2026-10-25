import React from 'react';
import { render } from '@testing-library/react-native';

import '@/i18n';
import { QuickAddPanel } from '@/components/quick-add-panel';
import type { QuickActionConfig } from '@/domain/quick-actions';
import type { Cat } from '@/types/domain';

const cat: Cat = {
  id: 'cat-1',
  name: 'Барсик',
  sex: 'male',
  birthDate: null,
  color: 'gray',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

const femaleCat: Cat = { ...cat, id: 'cat-2', name: 'Мурка', sex: 'female' };
const unknownCat: Cat = { ...cat, id: 'cat-3', name: 'Барсик', sex: 'unknown' };

const defaultQuickActions: QuickActionConfig[] = [
  { id: 'food', enabled: true, order: 0 },
  { id: 'pee', enabled: true, order: 1 },
  { id: 'poop', enabled: true, order: 2 },
];

let mockQuickActions: QuickActionConfig[] = defaultQuickActions;

jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => ({}) }));
jest.mock('@/context/app-context', () => ({
  useApp: () => ({ quickActions: mockQuickActions }),
}));
jest.mock('@/components/time-pill', () => ({ TimePill: () => null }));
jest.mock('@/utils/photo-picker', () => ({ pickPhoto: jest.fn() }));

function renderPanel(c: Cat = cat) {
  return render(<QuickAddPanel cat={c} feeds={[]} onMutated={() => {}} />);
}

describe('QuickAddPanel', () => {
  beforeEach(() => {
    mockQuickActions = defaultQuickActions.map((c) => ({ ...c }));
  });

  it('рендерит кнопки всех включённых блоков', () => {
    const { getByTestId } = renderPanel();

    expect(getByTestId('quickadd-food')).toBeTruthy();
    expect(getByTestId('quickadd-pee')).toBeTruthy();
    expect(getByTestId('quickadd-poop')).toBeTruthy();
  });

  it('подписывает кнопки по полу кота', () => {
    const male = renderPanel();
    expect(male.getByText('Поел')).toBeTruthy();
    expect(male.getByText('Пописял')).toBeTruthy();
    expect(male.getByText('Покакал')).toBeTruthy();

    const female = renderPanel(femaleCat);
    expect(female.getByText('Поела')).toBeTruthy();
    expect(female.getByText('Пописяла')).toBeTruthy();
    expect(female.getByText('Покакала')).toBeTruthy();

    const unknown = renderPanel(unknownCat);
    expect(unknown.getByText('Поел(а)')).toBeTruthy();
    expect(unknown.getByText('Пописял(а)')).toBeTruthy();
    expect(unknown.getByText('Покакал(а)')).toBeTruthy();
  });

  it('не рендерит выключенные блоки', () => {
    mockQuickActions = defaultQuickActions.map((c) =>
      c.id === 'food' ? { ...c, enabled: false } : c
    );

    const { queryByTestId } = renderPanel();

    expect(queryByTestId('quickadd-food')).toBeNull();
    expect(queryByTestId('quickadd-pee')).toBeTruthy();
  });

  it('рендерит блоки в порядке из конфига', () => {
    mockQuickActions = [
      { id: 'poop', enabled: true, order: 0 },
      { id: 'food', enabled: true, order: 1 },
      { id: 'pee', enabled: true, order: 2 },
    ];

    const { getByTestId } = renderPanel();

    expect(getByTestId('quickadd-poop')).toBeTruthy();
  });
});
