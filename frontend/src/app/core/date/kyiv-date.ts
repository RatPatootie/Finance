export type DateKey = string;

export const KYIV_TZ = 'Europe/Kyiv';

// en-CA formats dates as YYYY-MM-DD.
const kyivDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: KYIV_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const kyivOffsetFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: KYIV_TZ,
  timeZoneName: 'longOffset',
});

export function kyivDateKey(instant: Date): DateKey {
  return kyivDateFormat.format(instant);
}

export function kyivOffsetMinutes(instant: Date): number {
  const name = kyivOffsetFormat.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

export function addDays(key: DateKey, days: number): DateKey {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function kyivStartOfDay(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  // Kyiv switches DST at 03:00/04:00, never at midnight, so one correction is enough.
  let instant = utcMidnight - kyivOffsetMinutes(new Date(utcMidnight)) * 60_000;
  instant = utcMidnight - kyivOffsetMinutes(new Date(instant)) * 60_000;
  return new Date(instant);
}

export function msUntilNextKyivMidnight(instant: Date): number {
  const next = kyivStartOfDay(addDays(kyivDateKey(instant), 1));
  return next.getTime() - instant.getTime();
}

export function dateKeyToPickerDate(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function pickerDateToDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
