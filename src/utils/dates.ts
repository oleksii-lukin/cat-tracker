import i18n from '@/i18n';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(day: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(i18n.language, options).format(parseDayKey(day));
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, delta: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + delta);
  return dayKey(d);
}

export function formatDay(day: string): string {
  return formatDate(day, { day: 'numeric', month: 'long' });
}

export function weekdayShort(day: string): string {
  return capitalize(formatDate(day, { weekday: 'short' }));
}

export function relativeDayLabel(day: string): string {
  const today = todayKey();
  if (day === today) return i18n.t('date.today');
  if (day === addDays(today, -1)) return i18n.t('date.yesterday');
  const weekday = capitalize(formatDate(day, { weekday: 'long' }));
  return `${weekday}, ${formatDay(day)}`;
}

export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function monthLabel(day: string): string {
  return capitalize(formatDate(day, { month: 'long', year: 'numeric' }));
}

export function formatTimeOptional(time: string | null): string | null {
  return time;
}

export function formatWeightGrams(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg.toFixed(2)} ${i18n.t('units.kilogram')}`;
  }
  return `${grams} ${i18n.t('units.gram')}`;
}

export function formatBirthDate(birthDate: string | null): string | null {
  return birthDate;
}
