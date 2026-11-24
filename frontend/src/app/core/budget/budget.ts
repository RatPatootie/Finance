import { DateKey } from '../date/kyiv-date';
import { BudgetSettings, Expense } from '../db/models';

/**
 * Budget calculation. Pure functions on Kyiv date keys and integer kopecks:
 * no clock, no time zone, no floating-point money.
 */

export type BudgetStatus = 'green' | 'yellow' | 'red';

export interface Budget {
  /** Current balance; may be negative. */
  balance: number;
  /** Daily limit for today; never below 0. */
  limit: number;
  /** Today's counted spending. */
  spentToday: number;
  /** limit − spentToday; negative when over the limit. */
  left: number;
  status: BudgetStatus;
}

/** Yellow from this share of the limit: 4/5 = 80 %. Kept as a ratio for integer math. */
const YELLOW_NUM = 4;
const YELLOW_DEN = 5;

function parts(key: DateKey): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m, d];
}

function toKey(y: number, m: number, d: number): DateKey {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Days in a month (`month` is 1-12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Days left in the month of `today`, counting today (30 Nov -> 1). */
export function daysLeftInMonth(today: DateKey): number {
  const [y, m, d] = parts(today);
  return daysInMonth(y, m) - d + 1;
}

/**
 * How many paydays fall after `fromExclusive` and on or before `toInclusive`.
 * A payday past the end of a short month falls on its last day.
 */
export function paydaysBetween(fromExclusive: DateKey, toInclusive: DateKey, payday: number): number {
  if (toInclusive <= fromExclusive) return 0;
  let [y, m] = parts(fromExclusive);
  const [toY, toM] = parts(toInclusive);
  let count = 0;
  while (y < toY || (y === toY && m <= toM)) {
    const day = toKey(y, m, Math.min(payday, daysInMonth(y, m)));
    if (day > fromExclusive && day <= toInclusive) count++;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return count;
}

/**
 * Whether an expense changes the balance. Expenses dated before the balance day,
 * or recorded on that day before the balance was saved, are already inside it.
 */
export function isCounted(expense: Expense, settings: BudgetSettings): boolean {
  if (expense.isDeleted || settings.balanceDate === null || settings.balanceSetAt === null) return false;
  if (expense.date > settings.balanceDate) return true;
  return expense.date === settings.balanceDate && expense.createdAt >= settings.balanceSetAt;
}

/** Balance, daily limit, left for today and status; null until a balance is set. */
export function computeBudget(settings: BudgetSettings, expenses: readonly Expense[], today: DateKey): Budget | null {
  if (settings.balanceKopecks === null || settings.balanceDate === null) return null;

  let spentAll = 0;
  let spentToday = 0;
  for (const e of expenses) {
    if (!isCounted(e, settings)) continue;
    spentAll += e.amountKopecks;
    if (e.date === today) spentToday += e.amountKopecks;
  }

  const income = settings.monthlyIncomeKopecks * paydaysBetween(settings.balanceDate, today, settings.payday);
  const balance = settings.balanceKopecks + income - spentAll;

  // The limit comes from the money at the start of today, so spending during the day doesn't shrink it.
  const freeAtStartOfDay = balance + spentToday;
  const limit = freeAtStartOfDay > 0 ? Math.floor(freeAtStartOfDay / daysLeftInMonth(today)) : 0;
  const left = limit - spentToday;

  let status: BudgetStatus;
  if (limit <= 0 || left < 0) status = 'red';
  else if (spentToday * YELLOW_DEN >= limit * YELLOW_NUM) status = 'yellow';
  else status = 'green';

  return { balance, limit, spentToday, left, status };
}
