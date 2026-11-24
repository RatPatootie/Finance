import {
  addDays,
  dateKeyToPickerDate,
  kyivDateKey,
  kyivStartOfDay,
  msUntilNextKyivMidnight,
  pickerDateToDateKey,
} from './kyiv-date';

const HOUR = 3_600_000;

describe('kyivDateKey', () => {
  it('23:30 Kyiv on the last day of the month is still that day', () => {
    // 2026-11-30 23:30 Kyiv (UTC+2) = 21:30 UTC
    expect(kyivDateKey(new Date('2026-11-30T21:30:00Z'))).toBe('2026-11-30');
  });

  it('00:10 Kyiv belongs to the new month even though UTC is still the previous day', () => {
    // 2026-12-01 00:10 Kyiv = 2026-11-30 22:10 UTC
    expect(kyivDateKey(new Date('2026-11-30T22:10:00Z'))).toBe('2026-12-01');
  });

  it('rolls from 28 Feb to 1 Mar at Kyiv midnight', () => {
    expect(kyivDateKey(new Date('2026-02-28T21:59:59Z'))).toBe('2026-02-28');
    expect(kyivDateKey(new Date('2026-02-28T22:00:00Z'))).toBe('2026-03-01');
  });

  it('handles the spring-forward day (2026-03-29)', () => {
    // 03:30 Kyiv summer time (UTC+3) = 00:30 UTC
    expect(kyivDateKey(new Date('2026-03-29T00:30:00Z'))).toBe('2026-03-29');
    // 23:30 Kyiv summer time = 20:30 UTC
    expect(kyivDateKey(new Date('2026-03-29T20:30:00Z'))).toBe('2026-03-29');
    expect(kyivDateKey(new Date('2026-03-29T21:00:00Z'))).toBe('2026-03-30');
  });

  it('handles the fall-back day (2026-10-25)', () => {
    // midnight that day is still summer time: 2026-10-24 21:00 UTC
    expect(kyivDateKey(new Date('2026-10-24T21:00:00Z'))).toBe('2026-10-25');
    // that evening is winter time: 23:59 Kyiv = 21:59 UTC
    expect(kyivDateKey(new Date('2026-10-25T21:59:00Z'))).toBe('2026-10-25');
    expect(kyivDateKey(new Date('2026-10-25T22:00:00Z'))).toBe('2026-10-26');
  });

  it('uses Kyiv even when it is still the previous day in New York', () => {
    // 2026-11-30 19:00 New York (UTC-5) = 2026-12-01 00:00 UTC = 02:00 Kyiv
    expect(kyivDateKey(new Date('2026-12-01T00:00:00Z'))).toBe('2026-12-01');
  });
});

describe('addDays', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('kyivStartOfDay', () => {
  it('is 22:00 UTC the day before in winter and 21:00 UTC in summer', () => {
    expect(kyivStartOfDay('2026-12-01').toISOString()).toBe('2026-11-30T22:00:00.000Z');
    expect(kyivStartOfDay('2026-07-01').toISOString()).toBe('2026-06-30T21:00:00.000Z');
  });

  it('is correct on both DST change days', () => {
    expect(kyivStartOfDay('2026-03-29').toISOString()).toBe('2026-03-28T22:00:00.000Z');
    expect(kyivStartOfDay('2026-10-25').toISOString()).toBe('2026-10-24T21:00:00.000Z');
  });
});

describe('msUntilNextKyivMidnight', () => {
  it('counts to the next Kyiv midnight', () => {
    expect(msUntilNextKyivMidnight(new Date('2026-11-30T21:30:00Z'))).toBe(0.5 * HOUR);
  });

  it('is 23 hours from the start of the spring-forward day', () => {
    expect(msUntilNextKyivMidnight(new Date('2026-03-28T22:00:00Z'))).toBe(23 * HOUR);
  });

  it('is 25 hours from the start of the fall-back day', () => {
    expect(msUntilNextKyivMidnight(new Date('2026-10-24T21:00:00Z'))).toBe(25 * HOUR);
  });
});

describe('picker date conversion', () => {
  it('round-trips a date key', () => {
    expect(pickerDateToDateKey(dateKeyToPickerDate('2026-11-22'))).toBe('2026-11-22');
  });
});
