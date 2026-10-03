const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const WEEKDAYS_FULL = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
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

export function formatDayRu(key: string): string {
  const d = parseDayKey(key);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function weekdayShort(key: string): string {
  return WEEKDAYS_SHORT[parseDayKey(key).getDay()];
}

export function relativeDayLabel(key: string): string {
  const today = todayKey();
  if (key === today) return 'Сегодня';
  if (key === addDays(today, -1)) return 'Вчера';
  const d = parseDayKey(key);
  const weekday = WEEKDAYS_FULL[d.getDay()];
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${formatDayRu(key)}`;
}

export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function monthLabel(key: string): string {
  const d = parseDayKey(key);
  return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTimeOptional(time: string | null): string | null {
  return time;
}

export function formatWeightGrams(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg.toFixed(2)} кг`;
  }
  return `${grams} г`;
}

export function formatBirthDate(birthDate: string | null): string | null {
  return birthDate;
}
