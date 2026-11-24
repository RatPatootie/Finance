import { DateKey } from '../date/kyiv-date';

/** IndexedDB cannot index booleans, so flags are stored as 0 | 1. */
export type Flag = 0 | 1;

export interface Expense {
  /** Client-generated UUID, stable across devices for sync. */
  id: string;
  /** Amount in kopecks (integer, > 0). */
  amountKopecks: number;
  categoryId: string;
  /**
   * The day the money was spent, as chosen by the user, in Europe/Kyiv
   * ("YYYY-MM-DD"). It may be in the past. Statistics and day totals
   * MUST group by this field, not by `createdAt`.
   */
  date: DateKey;
  /** Real instant the record was created (ISO 8601, UTC). Not the spending day. */
  createdAt: string;
  /** Last change instant (ISO 8601, UTC); drives last-write-wins sync. */
  updatedAt: string;
  /** Soft delete: deleted records stay so the deletion can be synced. */
  isDeleted: Flag;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  /** Hidden categories are not offered for new expenses. */
  isHidden: Flag;
  updatedAt: string;
  isDeleted: Flag;
}

/**
 * Budget settings, stored as one row (`id = 'budget'`).
 *
 * The balance is an anchor: the money the user had at `balanceSetAt`. The current
 * balance is derived from it (see core/budget/budget.ts), never written back.
 */
export interface BudgetSettings {
  id: 'budget';
  /** Balance entered by the user, in kopecks; null until set up. */
  balanceKopecks: number | null;
  /** Real instant the balance was saved (ISO 8601, UTC). */
  balanceSetAt: string | null;
  /**
   * Kyiv day of `balanceSetAt`, stored so the calculation does not depend on the
   * device time zone. Expenses dated before this day are already in the balance.
   */
  balanceDate: DateKey | null;
  monthlyIncomeKopecks: number;
  /** Day of month the income arrives, 1-31 (clamped to short months). */
  payday: number;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: BudgetSettings = {
  id: 'budget',
  balanceKopecks: null,
  balanceSetAt: null,
  balanceDate: null,
  monthlyIncomeKopecks: 0,
  payday: 1,
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export const DEFAULT_CATEGORIES: readonly string[] = ['Food', 'Transport', 'Health', 'Shopping', 'Fun'];

/** Returns an ISO timestamp strictly later than `previous` (guards same-millisecond edits). */
export function nextTimestamp(now: Date, previous?: string): string {
  const prev = previous ? Date.parse(previous) : -Infinity;
  return new Date(Math.max(now.getTime(), prev + 1)).toISOString();
}
