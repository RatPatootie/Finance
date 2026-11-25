import { DateKey } from '../date/kyiv-date';
import { BudgetSettings, Expense } from '../db/models';

export type BudgetStatus = 'green' | 'yellow' | 'red';

export interface Budget {
  balance: number;
  frozen: number;
  limit: number | null;
  spentToday: number;
  left: number | null;
  status: BudgetStatus | null;
}

export interface FrozenInfo {
  ids: ReadonlySet<string>;
  total: number;
}

export const NO_FROZEN: FrozenInfo = { ids: new Set(), total: 0 };

export interface FrozenTotals {
  byCategory: ReadonlyMap<string, number>;
  total: number;
}

export function frozenTotals(records: readonly Expense[], frozenIds: ReadonlySet<string>, day: DateKey): FrozenTotals {
  const sums = new Map<string, number>();
  for (const r of records) {
    if (r.isDeleted || r.date > day || !frozenIds.has(r.categoryId)) continue;
    const signed = r.kind === 'return' ? -r.amountKopecks : r.amountKopecks;
    sums.set(r.categoryId, (sums.get(r.categoryId) ?? 0) + signed);
  }
  const byCategory = new Map<string, number>();
  let total = 0;
  for (const [id, sum] of sums) {
    const clamped = Math.max(0, sum);
    byCategory.set(id, clamped);
    total += clamped;
  }
  return { byCategory, total };
}

const YELLOW_NUM = 4;
const YELLOW_DEN = 5;

function parts(key: DateKey): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m, d];
}

function toKey(y: number, m: number, d: number): DateKey {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function daysLeftInMonth(today: DateKey): number {
  const [y, m, d] = parts(today);
  return daysInMonth(y, m) - d + 1;
}

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

// Expenses recorded before the balance was saved are already inside it.
export function isCounted(expense: Expense, settings: BudgetSettings): boolean {
  if (expense.isDeleted || settings.balanceDate === null || settings.balanceSetAt === null) return false;
  if (expense.date > settings.balanceDate) return true;
  return expense.date === settings.balanceDate && expense.createdAt >= settings.balanceSetAt;
}

export function dailyLimit(settings: Pick<BudgetSettings, 'monthlyIncomeKopecks' | 'dailySharePercent'>, day: DateKey): number | null {
  const share = settings.dailySharePercent;
  if (share === undefined || share === null) return null;
  const [y, m] = parts(day);
  return Math.floor((settings.monthlyIncomeKopecks * share) / (100 * daysInMonth(y, m)));
}

export function spentOn(day: DateKey, records: readonly Expense[], frozenIds: ReadonlySet<string>): number {
  let sum = 0;
  for (const r of records) {
    if (!r.isDeleted && r.date === day && !frozenIds.has(r.categoryId)) sum += r.amountKopecks;
  }
  return sum;
}

export function spendingStatus(limit: number, spent: number): BudgetStatus {
  if (limit <= 0 || spent > limit) return 'red';
  if (spent * YELLOW_DEN >= limit * YELLOW_NUM) return 'yellow';
  return 'green';
}

export function computeBudget(
  settings: BudgetSettings,
  expenses: readonly Expense[],
  today: DateKey,
  frozen: FrozenInfo = NO_FROZEN,
  todayRecords: readonly Expense[] = expenses,
): Budget | null {
  if (settings.balanceKopecks === null || settings.balanceDate === null) return null;

  let spentSinceBalance = 0;
  for (const e of expenses) {
    if (frozen.ids.has(e.categoryId) || !isCounted(e, settings)) continue;
    spentSinceBalance += e.amountKopecks;
  }
  const income = settings.monthlyIncomeKopecks * paydaysBetween(settings.balanceDate, today, settings.payday);
  const balance = settings.balanceKopecks + income - spentSinceBalance;

  // Today's spending is not tied to the balance anchor: anything dated today counts against the limit.
  const spentToday = spentOn(today, todayRecords, frozen.ids);
  const limit = dailyLimit(settings, today);
  const left = limit === null ? null : limit - spentToday;
  const status = limit === null ? null : spendingStatus(limit, spentToday);

  return { balance, frozen: frozen.total, limit, spentToday, left, status };
}

export type DayState = 'none' | 'ok' | 'over' | 'unknown';

export function dayState(dayRecords: readonly Expense[], limit: number | null, frozenIds: ReadonlySet<string>): DayState {
  const spends = dayRecords.some((e) => !e.isDeleted && !frozenIds.has(e.categoryId));
  if (!spends) return 'none';
  if (limit === null) return 'unknown';
  const day = dayRecords[0].date;
  return spentOn(day, dayRecords, frozenIds) > limit ? 'over' : 'ok';
}
