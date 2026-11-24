import { BudgetSettings, DEFAULT_SETTINGS, Expense } from '../db/models';
import { computeBudget, daysLeftInMonth, isCounted, paydaysBetween } from './budget';

const settings = (s: Partial<BudgetSettings> = {}): BudgetSettings => ({
  ...DEFAULT_SETTINGS,
  balanceKopecks: 1_200_000,
  balanceSetAt: '2026-11-24T07:00:00.000Z', // 09:00 Kyiv
  balanceDate: '2026-11-24',
  ...s,
});

let n = 0;
const exp = (amountKopecks: number, date: string, createdAt = '2026-11-24T11:00:00.000Z', isDeleted: 0 | 1 = 0): Expense => ({
  id: `e${n++}`,
  amountKopecks,
  categoryId: 'c',
  date,
  createdAt,
  updatedAt: createdAt,
  isDeleted,
});

describe('daysLeftInMonth', () => {
  it.each([
    ['2026-11-30', 1],
    ['2026-11-24', 7],
    ['2026-12-01', 31],
    ['2027-02-28', 1],
    ['2028-02-29', 1],
    ['2028-02-28', 2],
  ])('%s -> %i', (day, left) => expect(daysLeftInMonth(day)).toBe(left));
});

describe('paydaysBetween', () => {
  it('does not count a payday on the anchor day itself', () => {
    expect(paydaysBetween('2026-11-24', '2026-11-30', 24)).toBe(0);
  });
  it('counts payday 25 on the 25th, not before', () => {
    expect(paydaysBetween('2026-11-24', '2026-11-24', 25)).toBe(0);
    expect(paydaysBetween('2026-11-24', '2026-11-25', 25)).toBe(1);
  });
  it('moves payday 31 to the last day of short months', () => {
    expect(paydaysBetween('2027-02-10', '2027-02-27', 31)).toBe(0);
    expect(paydaysBetween('2027-02-10', '2027-02-28', 31)).toBe(1);
    expect(paydaysBetween('2026-11-10', '2026-11-30', 31)).toBe(1);
  });
  it('counts two paydays across a month and year boundary', () => {
    expect(paydaysBetween('2026-11-24', '2027-01-05', 1)).toBe(2);
    expect(paydaysBetween('2026-11-24', '2027-01-05', 25)).toBe(2);
  });
  it('returns 0 for an empty range', () => {
    expect(paydaysBetween('2026-11-24', '2026-11-20', 22)).toBe(0);
  });
});

describe('isCounted', () => {
  const s = settings();
  it('counts an expense on the anchor day recorded after the balance was saved', () => {
    expect(isCounted(exp(1, '2026-11-24', '2026-11-24T07:00:00.000Z'), s)).toBe(true);
  });
  it('ignores an expense on the anchor day recorded before', () => {
    expect(isCounted(exp(1, '2026-11-24', '2026-11-24T06:00:00.000Z'), s)).toBe(false);
  });
  it('ignores a backdated expense before the anchor day, even if recorded later', () => {
    expect(isCounted(exp(1, '2026-11-20', '2026-11-25T10:00:00.000Z'), s)).toBe(false);
  });
  it('counts an expense dated after the anchor day', () => {
    expect(isCounted(exp(1, '2026-11-25', '2026-11-25T10:00:00.000Z'), s)).toBe(true);
  });
  it('ignores deleted expenses', () => {
    expect(isCounted(exp(1, '2026-11-25', '2026-11-25T10:00:00.000Z', 1), s)).toBe(false);
  });
});

describe('computeBudget', () => {
  it('is null until a balance is set', () => {
    expect(computeBudget(DEFAULT_SETTINGS, [], '2026-11-24')).toBeNull();
  });

  it('spreads 12 000 over 7 days: limit 1 714,28', () => {
    expect(computeBudget(settings(), [], '2026-11-24')).toEqual({
      balance: 1_200_000,
      limit: 171_428,
      spentToday: 0,
      left: 171_428,
      status: 'green',
    });
  });

  it('subtracts spending from the balance but keeps today’s limit', () => {
    const b = computeBudget(settings(), [exp(30_000, '2026-11-24')], '2026-11-24')!;
    expect(b).toMatchObject({ balance: 1_170_000, limit: 171_428, spentToday: 30_000, left: 141_428, status: 'green' });
  });

  it('does not subtract expenses already in the saved balance', () => {
    const b = computeBudget(settings(), [exp(8_500, '2026-11-24', '2026-11-24T06:00:00.000Z')], '2026-11-24')!;
    expect(b.balance).toBe(1_200_000);
    expect(b.spentToday).toBe(0);
  });

  it('subtracts a backdated expense after the anchor day and lowers today’s start money', () => {
    const s = settings({ balanceDate: '2026-11-20', balanceSetAt: '2026-11-20T07:00:00.000Z' });
    const b = computeBudget(s, [exp(10_000, '2026-11-22', '2026-11-24T10:00:00.000Z')], '2026-11-24')!;
    expect(b.balance).toBe(1_190_000);
    expect(b.limit).toBe(Math.floor(1_190_000 / 7));
  });

  it('adds income on payday', () => {
    const s = settings({ balanceKopecks: 1_000_000, monthlyIncomeKopecks: 3_000_000, payday: 25 });
    expect(computeBudget(s, [], '2026-11-24')!.balance).toBe(1_000_000);
    const b = computeBudget(s, [], '2026-11-25')!;
    expect(b.balance).toBe(4_000_000);
    expect(b.limit).toBe(Math.floor(4_000_000 / 6));
  });

  it('last day of the month: the whole free money', () => {
    const s = settings({ balanceKopecks: 50_000, balanceDate: '2026-11-30', balanceSetAt: '2026-11-30T07:00:00.000Z' });
    expect(computeBudget(s, [], '2026-11-30')!.limit).toBe(50_000);
  });

  it('first day of a new month: 31 days', () => {
    const s = settings({ balanceKopecks: 310_000, balanceDate: '2026-11-30', balanceSetAt: '2026-11-30T07:00:00.000Z' });
    expect(computeBudget(s, [], '2026-12-01')!.limit).toBe(10_000);
  });

  it('negative free money gives limit 0 and red', () => {
    const s = settings({ balanceKopecks: 0 });
    const neg = computeBudget(s, [exp(20_000, '2026-11-25', '2026-11-25T08:00:00.000Z')], '2026-11-26')!;
    expect(neg).toMatchObject({ balance: -20_000, limit: 0, left: 0, status: 'red' });
  });

  it('over the limit: left is negative and red', () => {
    const s = settings({ balanceKopecks: 50_000, balanceDate: '2026-11-30', balanceSetAt: '2026-11-30T07:00:00.000Z' });
    const b = computeBudget(s, [exp(62_000, '2026-11-30', '2026-11-30T08:00:00.000Z')], '2026-11-30')!;
    expect(b).toMatchObject({ limit: 50_000, left: -12_000, status: 'red' });
  });

  describe('status boundaries with a 1 000,00 limit', () => {
    // 1 000 on the last day of the month -> limit 100 000 kopecks.
    const s = settings({ balanceKopecks: 100_000, balanceDate: '2026-11-30', balanceSetAt: '2026-11-30T07:00:00.000Z' });
    const status = (spent: number) =>
      computeBudget(s, [exp(spent, '2026-11-30', '2026-11-30T08:00:00.000Z')], '2026-11-30')!.status;
    it.each([
      [79_999, 'green'],
      [80_000, 'yellow'],
      [100_000, 'yellow'],
      [100_001, 'red'],
    ])('spent %i -> %s', (spent, expected) => expect(status(spent)).toBe(expected));
  });

  it('limit 0 with nothing spent is red', () => {
    expect(computeBudget(settings({ balanceKopecks: 0 }), [], '2026-11-24')!.status).toBe('red');
  });
});
