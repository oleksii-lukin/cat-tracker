import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { CatChips } from '@/components/cat-chips';
import type { Cat } from '@/types/domain';

const cats: Cat[] = [
  {
    id: 'cat-1',
    name: 'Барсик',
    sex: 'male',
    birthDate: null,
    color: 'gray',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'cat-2',
    name: 'Маркиз',
    sex: 'unknown',
    birthDate: null,
    color: 'orange_tabby',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    deletedAt: null,
  },
];

describe('CatChips', () => {
  it('рендерит имя каждого кота', () => {
    const { getByText } = render(
      <CatChips cats={cats} currentCatId="cat-1" onSelect={() => {}} />
    );

    expect(getByText('Барсик')).toBeTruthy();
    expect(getByText('Маркиз')).toBeTruthy();
  });

  it('вызывает onSelect с id кота по тапу', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <CatChips cats={cats} currentCatId="cat-1" onSelect={onSelect} />
    );

    fireEvent.press(getByText('Маркиз'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('cat-2');
  });

  it('ничего не рендерит при пустом списке', () => {
    const { toJSON } = render(
      <CatChips cats={[]} currentCatId={null} onSelect={() => {}} />
    );

    expect(toJSON()).toBeNull();
  });
});
