import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { todayKey } from '@/utils/dates';

/** Возврат из фона дольше этого интервала — повод освежить данные, даже если день тот же. */
export const RESUME_REFRESH_MS = 60_000;

/** Как часто проверяем, не наступили ли новые сутки, пока приложение на экране. */
const DAY_CHECK_INTERVAL_MS = 60_000;

interface UseTodayKeyOptions {
  /** Вызывается при возврате из фона, если в фоне прошло больше resumeThresholdMs. */
  onLongResume?: () => void;
  resumeThresholdMs?: number;
}

/**
 * Актуальный ключ суток (dayKey), который обновляется сам.
 *
 * Значение читается во время рендера, поэтому без реактивного состояния «Сегодня»
 * после долгого фона оставалось бы вчерашним. Хук держит день в состоянии и
 * обновляет его:
 * - сразу при возврате в active (AppState), чтобы не ждать следующего тика;
 * - каждые DAY_CHECK_INTERVAL_MS, чтобы «Сегодня» сменилось в полночь,
 *   даже если приложение открыто на экране всю ночь.
 *
 * Таймеры в фоне ОС приостанавливает, поэтому длину фона меряем разницей
 * Date.now() на уходе и возврате, а не количеством тиков.
 *
 * iOS: состояние inactive (шторка, звонок) фоном не считаем — иначе лишние
 * перезагрузки при каждом открытии уведомлений.
 */
export function useTodayKey(options?: UseTodayKeyOptions): string {
  const resumeThresholdMs = options?.resumeThresholdMs ?? RESUME_REFRESH_MS;
  const onLongResume = options?.onLongResume;

  const onLongResumeRef = useRef(onLongResume);
  useEffect(() => {
    onLongResumeRef.current = onLongResume;
  }, [onLongResume]);

  const [today, setToday] = useState<string>(() => todayKey());
  const dayRef = useRef<string>(today);

  useEffect(() => {
    const sync = () => {
      const next = todayKey();
      if (next === dayRef.current) return;
      dayRef.current = next;
      setToday(next);
    };

    const interval = setInterval(sync, DAY_CHECK_INTERVAL_MS);
    let backgroundedAt: number | null = null;

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        backgroundedAt = Date.now();
        return;
      }
      if (state !== 'active') return;
      sync();
      const elapsed = backgroundedAt === null ? 0 : Date.now() - backgroundedAt;
      backgroundedAt = null;
      if (elapsed > resumeThresholdMs) onLongResumeRef.current?.();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [resumeThresholdMs]);

  return today;
}
