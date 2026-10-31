import { act, renderHook } from '@testing-library/react-native';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';

import { RESUME_REFRESH_MS, useTodayKey } from '@/hooks/use-today';

type ChangeHandler = (state: AppStateStatus) => void;

/** Последний зарегистрированный слушатель 'change' из AppState (мок jest-expo/RN). */
function lastAppStateHandler(): ChangeHandler {
  const calls = (AppState.addEventListener as unknown as jest.Mock).mock.calls;
  const changeCalls = calls.filter(([event]) => event === 'change');
  return changeCalls[changeCalls.length - 1][1] as ChangeHandler;
}

function go(state: AppStateStatus): void {
  act(() => lastAppStateHandler()(state));
}

describe('useTodayKey', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (AppState.addEventListener as unknown as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('возвращает текущий день', () => {
    jest.setSystemTime(new Date(2026, 9, 31, 12, 0));

    const { result } = renderHook(() => useTodayKey());

    expect(result.current).toBe('2026-10-31');
  });

  it('переходит на новый день по интервалу, когда приложение открыто на экране', () => {
    jest.setSystemTime(new Date(2026, 9, 31, 23, 59, 30));

    const { result } = renderHook(() => useTodayKey());

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe('2026-11-01');
  });

  it('при возврате из фона сразу проверяет день и дёргает onLongResume', () => {
    jest.setSystemTime(new Date(2026, 9, 31, 23, 59));
    const onLongResume = jest.fn();

    const { result } = renderHook(() => useTodayKey({ onLongResume }));

    go('background');
    jest.setSystemTime(new Date(2026, 10, 1, 0, 30));
    go('active');

    expect(result.current).toBe('2026-11-01');
    expect(onLongResume).toHaveBeenCalledTimes(1);
  });

  it('короткое переключение в фон не дёргает onLongResume', () => {
    jest.setSystemTime(new Date(2026, 9, 31, 23, 59, 30));
    const onLongResume = jest.fn();

    const { result } = renderHook(() => useTodayKey({ onLongResume }));

    go('background');
    jest.setSystemTime(new Date(2026, 9, 31, 23, 59, 50));
    go('active');

    expect(result.current).toBe('2026-10-31');
    expect(onLongResume).not.toHaveBeenCalled();
  });

  it('долгий фон в пределах одного дня дёргает onLongResume, но день остаётся прежним', () => {
    jest.setSystemTime(new Date(2026, 9, 31, 10, 0));
    const onLongResume = jest.fn();

    const { result } = renderHook(() => useTodayKey({ onLongResume }));

    go('background');
    jest.setSystemTime(new Date(2026, 9, 31, 10, 0).getTime() + RESUME_REFRESH_MS + 1000);
    go('active');

    expect(result.current).toBe('2026-10-31');
    expect(onLongResume).toHaveBeenCalledTimes(1);
  });

  it('inactive (шторка на iOS) не считается фоном', () => {
    jest.setSystemTime(new Date(2026, 9, 31, 22, 0));
    const onLongResume = jest.fn();

    const { result } = renderHook(() => useTodayKey({ onLongResume }));

    go('inactive');
    jest.setSystemTime(new Date(2026, 9, 31, 23, 0));
    go('active');

    expect(result.current).toBe('2026-10-31');
    expect(onLongResume).not.toHaveBeenCalled();
  });

  it('возвращает прежний ключ суток, если день не менялся', () => {
    jest.setSystemTime(new Date(2026, 9, 31, 9, 0));

    const { result } = renderHook(() => useTodayKey());

    go('background');
    jest.setSystemTime(new Date(2026, 9, 31, 9, 5));
    go('active');

    expect(result.current).toBe('2026-10-31');
  });
});
