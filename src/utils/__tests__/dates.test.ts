import i18n from '@/i18n';
import {
  addDays,
  dateAtTime,
  dayKey,
  formatTime,
  formatWeightGrams,
  isValidTime,
  monthLabel,
  parseDayKey,
  relativeDayLabel,
  todayKey,
  weekdayShort,
} from '@/utils/dates';

describe('dayKey / parseDayKey', () => {
  it('форматирует дату в YYYY-MM-DD с паддингом', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 10, 23))).toBe('2026-11-23');
  });

  it('roundtrip: parseDayKey(dayKey(d)) === d (по компонентам)', () => {
    const d = new Date(2026, 6, 17);
    const parsed = parseDayKey(dayKey(d));
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(17);
  });
});

describe('addDays', () => {
  it('переходит через границу месяца', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('переходит через границу года', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('учитывает високосный год', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('складывает большие интервалы', () => {
    expect(addDays('2026-01-01', 45)).toBe('2026-02-15');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('todayKey', () => {
  it('возвращает сегодняшнюю дату в формате dayKey', () => {
    expect(todayKey()).toBe(dayKey(new Date()));
  });
});

describe('formatTime', () => {
  it('форматирует время с паддингом', () => {
    expect(formatTime(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
    expect(formatTime(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
    expect(formatTime(new Date(2026, 0, 1, 0, 0))).toBe('00:00');
  });
});

describe('isValidTime', () => {
  it('принимает только нормализованный HH:MM в пределах 00:00–23:59', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('09:30')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
  });

  it('отклоняет легаси-формат и мусор', () => {
    expect(isValidTime('9:30')).toBe(false);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('12:60')).toBe(false);
    expect(isValidTime('1230')).toBe(false);
    expect(isValidTime('')).toBe(false);
  });
});

describe('dateAtTime', () => {
  it('склеивает день и время в локальный момент', () => {
    const d = dateAtTime('2026-01-05', '12:05');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(5);
    expect(d.getHours()).toBe(12);
    expect(d.getMinutes()).toBe(5);
  });

  it('терпит легаси-время «9:05» и мусор', () => {
    expect(formatTime(dateAtTime('2026-01-05', '9:05'))).toBe('09:05');
    expect(formatTime(dateAtTime('2026-01-05', ''))).toBe('00:00');
    expect(formatTime(dateAtTime('2026-01-05', '99:99'))).toBe('23:59');
  });
});

describe('formatWeightGrams', () => {
  it('граммы без изменений', () => {
    expect(formatWeightGrams(250)).toBe('250 г');
    expect(formatWeightGrams(0)).toBe('0 г');
  });

  it('килограммы при >= 1000, с двумя знаками', () => {
    expect(formatWeightGrams(1000)).toBe('1.00 кг');
    expect(formatWeightGrams(1234)).toBe('1.23 кг');
    expect(formatWeightGrams(4500)).toBe('4.50 кг');
  });
});

describe('относительные и форматированные метки (ru)', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('ru');
  });

  it('relativeDayLabel: сегодня и вчера', () => {
    const today = todayKey();
    expect(relativeDayLabel(today)).toBe('Сегодня');
    expect(relativeDayLabel(addDays(today, -1))).toBe('Вчера');
  });

  it('relativeDayLabel: прошлая дата —weekday + дата', () => {
    // 2026-01-05 — понедельник
    const label = relativeDayLabel('2026-01-05');
    expect(label).toBe('Понедельник, 5 января');
  });

  it('weekdayShort и monthLabel капitalizeлизуют и используют ru-локаль', () => {
    expect(weekdayShort('2026-01-05')).toBe('Пн');
    expect(monthLabel('2026-01-05')).toBe('Январь 2026 г.');
  });
});
