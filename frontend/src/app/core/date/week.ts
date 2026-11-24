import { addDays, DateKey } from './kyiv-date';

const dayMonthFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const weekdayFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long' });
const longDateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long' });

function toUtcDate(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function startOfWeek(day: DateKey): DateKey {
  const fromMonday = (toUtcDate(day).getUTCDay() + 6) % 7;
  return addDays(day, -fromMonday);
}

export function weekDays(monday: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatWeekLabel(monday: DateKey): string {
  const sunday = addDays(monday, 6);
  if (monday.slice(0, 7) === sunday.slice(0, 7)) {
    return `${Number(monday.slice(8))}–${dayMonthFormat.format(toUtcDate(sunday))}`;
  }
  return `${dayMonthFormat.format(toUtcDate(monday))} – ${dayMonthFormat.format(toUtcDate(sunday))}`;
}

export function formatLongDay(day: DateKey): string {
  const date = toUtcDate(day);
  return `${weekdayFormat.format(date)} ${longDateFormat.format(date)}`;
}

export function weeksBetween(fromMonday: DateKey, toMonday: DateKey): number {
  return Math.round((toUtcDate(toMonday).getTime() - toUtcDate(fromMonday).getTime()) / (7 * 86_400_000));
}
