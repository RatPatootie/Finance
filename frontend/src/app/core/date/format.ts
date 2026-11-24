import { DateKey, KYIV_TZ } from './kyiv-date';

const dayLabelFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: KYIV_TZ,
  hour: '2-digit',
  minute: '2-digit',
});

/** "2026-11-22" -> "Sun 22 Nov". */
export function formatDayLabel(key: DateKey): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayLabelFormat.format(new Date(Date.UTC(y, m - 1, d))).replace(',', '');
}

/** ISO instant -> "14:05" in Kyiv time. */
export function formatKyivTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}
