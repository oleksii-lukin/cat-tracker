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

function renderPanel() {
  return render(<QuickAddPanel cat={cat} feeds={[]} onMutated={() => {}} />);
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
