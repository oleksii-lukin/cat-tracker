import { DEFAULT_QUICK_ACTIONS } from '@/domain/quick-actions/defaults';
import { QUICK_ACTIONS_REGISTRY } from '@/domain/quick-actions/registry';
import {
  getEnabledSorted,
  getIdsInOrder,
  mergeWithDefaults,
  moveInList,
} from '@/domain/quick-actions/selectors';
import type { QuickActionConfig } from '@/domain/quick-actions/types';

describe('mergeWithDefaults', () => {
  it('возвращает дефолты при пустом сторе', () => {
    expect(mergeWithDefaults(null, DEFAULT_QUICK_ACTIONS)).toEqual(DEFAULT_QUICK_ACTIONS);
    expect(mergeWithDefaults([], DEFAULT_QUICK_ACTIONS)).toEqual(DEFAULT_QUICK_ACTIONS);
  });

  it('сохраняет пользовательский enabled/order', () => {
    const stored: QuickActionConfig[] = [
      { id: 'poop', enabled: false, order: 0 },
      { id: 'food', enabled: false, order: 1 },
      { id: 'pee', enabled: true, order: 2 },
    ];
    const merged = mergeWithDefaults(stored, DEFAULT_QUICK_ACTIONS);
    expect(merged).toHaveLength(3);
    expect(merged.find((c) => c.id === 'poop')?.enabled).toBe(false);
    expect(merged.find((c) => c.id === 'food')?.enabled).toBe(false);
    expect(merged.find((c) => c.id === 'pee')?.enabled).toBe(true);
  });

  it('добавляет новые дефолтные id, отсутствующие в сторе', () => {
    const stored: QuickActionConfig[] = [{ id: 'food', enabled: false, order: 0 }];
    const extendedDefaults: QuickActionConfig[] = [
      ...DEFAULT_QUICK_ACTIONS,
      { id: 'pee' as const, enabled: true, order: 3 },
    ];
    const merged = mergeWithDefaults(stored, extendedDefaults);
    const ids = merged.map((c) => c.id);
    expect(ids).toContain('food');
    expect(ids).toContain('pee');
    expect(merged.find((c) => c.id === 'food')?.enabled).toBe(false);
  });

  it('сохраняет неизвестные id из стора (не выбрасывает данные пользователя)', () => {
    const stored: QuickActionConfig[] = [
      ...DEFAULT_QUICK_ACTIONS,
      { id: 'food' as const, enabled: true, order: 3 },
    ];
    const merged = mergeWithDefaults(stored, DEFAULT_QUICK_ACTIONS);
    expect(merged.map((c) => c.id)).toContain('pee');
  });
});

describe('getEnabledSorted', () => {
  it('возвращает только включённые, отсортированные по order', () => {
    const config: QuickActionConfig[] = [
      { id: 'poop', enabled: true, order: 0 },
      { id: 'pee', enabled: false, order: 1 },
      { id: 'food', enabled: true, order: 2 },
    ];
    const result = getEnabledSorted(QUICK_ACTIONS_REGISTRY, config);
    expect(result.map((d) => d.id)).toEqual(['poop', 'food']);
  });

  it('пропускает id, отсутствующие в реестре', () => {
    const config: QuickActionConfig[] = [
      { id: 'food', enabled: true, order: 0 },
      { id: 'unknown-id' as never, enabled: true, order: 1 },
    ];
    const result = getEnabledSorted(QUICK_ACTIONS_REGISTRY, config);
    expect(result.map((d) => d.id)).toEqual(['food']);
  });
});

describe('getIdsInOrder', () => {
  it('возвращает id в порядке order', () => {
    const config: QuickActionConfig[] = [
      { id: 'food', enabled: true, order: 2 },
      { id: 'pee', enabled: true, order: 0 },
      { id: 'poop', enabled: true, order: 1 },
    ];
    expect(getIdsInOrder(config)).toEqual(['pee', 'poop', 'food']);
  });
});

describe('moveInList', () => {
  it('меняет порядок соседей при перемещении вверх', () => {
    const config: QuickActionConfig[] = [
      { id: 'food', enabled: true, order: 0 },
      { id: 'pee', enabled: true, order: 1 },
    ];
    const result = moveInList(config, 'pee', -1);
    expect(getIdsInOrder(result)).toEqual(['pee', 'food']);
  });

  it('меняет порядок соседей при перемещении вниз', () => {
    const config: QuickActionConfig[] = [
      { id: 'food', enabled: true, order: 0 },
      { id: 'pee', enabled: true, order: 1 },
    ];
    const result = moveInList(config, 'food', 1);
    expect(getIdsInOrder(result)).toEqual(['pee', 'food']);
  });

  it('no-op на границе списка', () => {
    const config: QuickActionConfig[] = [
      { id: 'food', enabled: true, order: 0 },
      { id: 'pee', enabled: true, order: 1 },
    ];
    expect(getIdsInOrder(moveInList(config, 'food', -1))).toEqual(['food', 'pee']);
    expect(getIdsInOrder(moveInList(config, 'pee', 1))).toEqual(['food', 'pee']);
  });

  it('no-op для неизвестного id', () => {
    const config: QuickActionConfig[] = [{ id: 'food', enabled: true, order: 0 }];
    expect(moveInList(config, 'unknown' as never, 1)).toEqual(config);
  });
});
