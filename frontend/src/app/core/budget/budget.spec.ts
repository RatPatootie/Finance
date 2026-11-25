import { BudgetSettings, DEFAULT_SETTINGS, Expense } from '../db/models';
import { computeBudget, dailyLimit, daysLeftInMonth, dayState, frozenTotals, isCounted, paydaysBetween, spentOn } from './budget';

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


const share = (s: Partial<BudgetSettings> = {}) => settings({ monthlyIncomeKopecks: 3_000_000, dailySharePercent: 40, ...s });

describe('dailyLimit', () => {
  it.each([
    ['2026-11-24', 40_000],
    ['2026-12-05', 38_709],
    ['2027-02-10', 42_857],
    ['2028-02-10', 41_379],
  ])('30 000 x 40 %% on %s -> %i kopecks', (day, limit) => expect(dailyLimit(share(), day)).toBe(limit));

  it('is null until a share is set, 0 with no income', () => {
    expect(dailyLimit(settings({ monthlyIncomeKopecks: 3_000_000 }), '2026-11-24')).toBeNull();
    expect(dailyLimit(share({ monthlyIncomeKopecks: 0 }), '2026-11-24')).toBe(0);
  });
});

describe('spentOn', () => {
  it('adds non-deleted, non-frozen records of that day only', () => {
    const frozen = { ...exp(9_000, '2026-11-24'), categoryId: 'vac' };
    const records = [exp(1_000, '2026-11-24'), exp(2_000, '2026-11-24', undefined, 1), exp(4_000, '2026-11-23'), frozen];
    expect(spentOn('2026-11-24', records, new Set(['vac']))).toBe(1_000);
  });
});

describe('computeBudget', () => {
  it('is null until a balance is set', () => {
    expect(computeBudget(DEFAULT_SETTINGS, [], '2026-11-24')).toBeNull();
  });

  it('has a balance but no limit until a share is set', () => {
    expect(computeBudget(settings(), [], '2026-11-24')).toEqual({
      balance: 1_200_000,
      frozen: 0,
      limit: null,
      spentToday: 0,
      left: null,
      status: null,
    });
  });

  it('limit from income; spending today lowers left but not the limit', () => {
    const b = computeBudget(share(), [exp(15_000, '2026-11-24')], '2026-11-24')!;
    expect(b).toMatchObject({ balance: 1_185_000, limit: 40_000, spentToday: 15_000, left: 25_000, status: 'green' });
  });

  it('the balance does not change the limit, even when negative', () => {
    const b = computeBudget(share({ balanceKopecks: -500_000 }), [], '2026-11-24')!;
    expect(b).toMatchObject({ balance: -500_000, limit: 40_000, left: 40_000 });
  });

  it('spending recorded before the balance still counts for today, not for the balance', () => {
    const early = exp(10_000, '2026-11-24', '2026-11-24T06:00:00.000Z');
    const b = computeBudget(share(), [early], '2026-11-24')!;
    expect(b).toMatchObject({ balance: 1_200_000, spentToday: 10_000, left: 30_000 });
  });

  it('subtracts a backdated expense after the anchor day from the balance', () => {
    const s = share({ balanceDate: '2026-11-20', balanceSetAt: '2026-11-20T07:00:00.000Z' });
    const b = computeBudget(s, [exp(10_000, '2026-11-22', '2026-11-24T10:00:00.000Z')], '2026-11-24')!;
    expect(b).toMatchObject({ balance: 1_190_000, spentToday: 0, limit: 40_000 });
  });

  it('adds income on payday to the balance', () => {
    const s = share({ balanceKopecks: 1_000_000, payday: 25 });
    expect(computeBudget(s, [], '2026-11-24')!.balance).toBe(1_000_000);
    expect(computeBudget(s, [], '2026-11-25')!.balance).toBe(4_000_000);
  });

  it('over the limit: left is negative and red', () => {
    const b = computeBudget(share(), [exp(52_000, '2026-11-24')], '2026-11-24')!;
    expect(b).toMatchObject({ limit: 40_000, left: -12_000, status: 'red' });
  });

  describe('status boundaries with a 1 000,00 limit', () => {
    const s = share({ monthlyIncomeKopecks: 7_500_000 });
    const status = (spent: number) => computeBudget(s, [exp(spent, '2026-11-24')], '2026-11-24')!.status;
    it('the limit is 1 000,00', () => expect(computeBudget(s, [], '2026-11-24')!.limit).toBe(100_000));
    it.each([
      [79_999, 'green'],
      [80_000, 'yellow'],
      [100_000, 'yellow'],
      [100_001, 'red'],
    ])('spent %i -> %s', (spent, expected) => expect(status(spent)).toBe(expected));
  });

  it('limit 0 (no income) with nothing spent is red', () => {
    expect(computeBudget(share({ monthlyIncomeKopecks: 0 }), [], '2026-11-24')!.status).toBe('red');
  });
});

describe('frozen money', () => {
  const VAC = 'vac';
  const ids = new Set([VAC]);
  const rec = (amount: number, date: string, kind?: 'return', isDeleted: 0 | 1 = 0): Expense => ({
    ...exp(amount, date, '2026-11-24T08:00:00.000Z', isDeleted),
    categoryId: VAC,
    ...(kind ? { kind } : {}),
  });

  it('freeze, freeze, return = 1 800 per category and in total', () => {
    const t = frozenTotals([rec(200_000, '2026-11-20'), rec(50_000, '2026-11-21'), rec(70_000, '2026-11-22', 'return')], ids, '2026-11-24');
    expect(t.byCategory.get(VAC)).toBe(180_000);
    expect(t.total).toBe(180_000);
  });

  it('ignores deleted records, records after the day and other categories', () => {
    const t = frozenTotals(
      [rec(200_000, '2026-11-20', undefined, 1), rec(10_000, '2026-11-25'), exp(5_000, '2026-11-20'), rec(30_000, '2026-11-24')],
      ids,
      '2026-11-24',
    );
    expect(t.total).toBe(30_000);
  });

  it('a category never goes below 0', () => {
    expect(frozenTotals([rec(10_000, '2026-11-20'), rec(30_000, '2026-11-21', 'return')], ids, '2026-11-24').total).toBe(0);
  });

  it('a freeze changes neither the balance, today’s spending nor the limit', () => {
    const freeze = rec(200_000, '2026-11-24');
    const b = computeBudget(share(), [freeze], '2026-11-24', { ids, total: 200_000 })!;
    expect(b).toMatchObject({ balance: 1_200_000, frozen: 200_000, spentToday: 0, limit: 40_000, left: 40_000 });
  });
});

describe('dayState', () => {
  const none = new Set<string>();
  const at = (date: string, amount: number) => exp(amount, date, `${date}T08:00:00.000Z`);

  it('within, equal and over the limit; no spending; no share', () => {
    expect(dayState([at('2026-11-20', 40_000)], 40_000, none)).toBe('ok');
    expect(dayState([at('2026-11-20', 30_000), at('2026-11-20', 10_001)], 40_000, none)).toBe('over');
    expect(dayState([], 40_000, none)).toBe('none');
    expect(dayState([at('2026-11-20', 100)], null, none)).toBe('unknown');
  });

  it('a day with only frozen or deleted records counts as none', () => {
    const ids = new Set(['vac']);
    const freeze = { ...at('2026-11-29', 10_000), categoryId: 'vac' };
    const deleted = { ...at('2026-11-29', 10_000), isDeleted: 1 as const };
    expect(dayState([freeze, deleted], 40_000, ids)).toBe('none');
  });
});