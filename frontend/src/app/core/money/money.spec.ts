import { formatUah, toAmountString, toKopecks } from './money';

describe('toKopecks', () => {
  it.each([
    ['0.29', 29],
    ['49.99', 4999],
    ['125', 12500],
    ['0.5', 50],
    ['0.', 0],
    ['', 0],
    ['0', 0],
    ['0.00', 0],
    ['9999999.99', 999_999_999],
  ])('%s -> %i', (input, expected) => {
    expect(toKopecks(input)).toBe(expected);
  });
});

describe('toAmountString', () => {
  it.each([
    [4999, '49.99'],
    [12500, '125'],
    [50, '0.50'],
    [5, '0.05'],
  ])('%i -> %s', (input, expected) => {
    expect(toAmountString(input)).toBe(expected);
  });

  it('round-trips through toKopecks', () => {
    for (const k of [1, 29, 4999, 12500, 999_999_999]) {
      expect(toKopecks(toAmountString(k))).toBe(k);
    }
  });
});

describe('formatUah', () => {
  // Intl uses a (narrow) no-break space as the group separator.
  const normalize = (s: string) => s.replace(/[  ]/g, ' ');

  it('formats with comma decimals and the hryvnia sign', () => {
    expect(normalize(formatUah(12500))).toBe('125,00 ₴');
    expect(normalize(formatUah(0))).toBe('0,00 ₴');
    expect(normalize(formatUah(4999))).toBe('49,99 ₴');
  });

  it('groups thousands', () => {
    expect(normalize(formatUah(999_999_999))).toBe('9 999 999,99 ₴');
  });
});
