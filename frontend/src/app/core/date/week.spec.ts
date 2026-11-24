import { formatLongDay, formatWeekLabel, startOfWeek, weekDays, weeksBetween } from './week';

describe('week helpers', () => {
  it.each([
    ['2026-11-23', '2026-11-23'],
    ['2026-11-24', '2026-11-23'],
    ['2026-11-29', '2026-11-23'],
    ['2026-11-01', '2026-10-26'],
    ['2027-01-01', '2026-12-28'],
    ['2026-03-29', '2026-03-23'],
    ['2026-10-25', '2026-10-19'],
  ])('%s starts on Monday %s', (day, monday) => expect(startOfWeek(day)).toBe(monday));

  it('lists 7 days across a month and a year', () => {
    expect(weekDays('2026-12-28')).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });

  it('labels a week inside and across months', () => {
    expect(formatWeekLabel('2026-11-23')).toBe('23–29 Nov');
    expect(formatWeekLabel('2026-10-26')).toBe('26 Oct – 1 Nov');
    expect(formatWeekLabel('2026-12-28')).toBe('28 Dec – 3 Jan');
  });

  it('formats a long day for screen readers', () => {
    expect(formatLongDay('2026-11-23')).toBe('Monday 23 November');
  });

  it('counts whole weeks between Mondays, across DST', () => {
    expect(weeksBetween('2026-11-23', '2026-11-16')).toBe(-1);
    expect(weeksBetween('2026-11-23', '2026-11-23')).toBe(0);
    expect(weeksBetween('2026-03-30', '2026-03-23')).toBe(-1);
  });
});