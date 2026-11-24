import { DateKey } from '../date/kyiv-date';

/** IndexedDB cannot index booleans, so flags are stored as 0 | 1. */
export type Flag = 0 | 1;

export interface Expense {
  id: string;
  amountKopecks: number;
  categoryId: string;
  // Spending day picked by the user; group statistics by this, not by createdAt.
  date: DateKey;
  createdAt: string;
  updatedAt: string;
  // In a frozen category a record freezes money; 'return' moves it back to the free money.
  kind?: 'return';
  /** Soft delete: deleted records stay so the deletion can be synced. */
  isDeleted: Flag;
}

export type CategoryType = 'normal' | 'frozen';

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  // Missing on categories created before types existed; read through categoryType().
  type?: CategoryType;
  isHidden: Flag;
  updatedAt: string;
  isDeleted: Flag;
}

export function categoryType(c: Pick<Category, 'type'>): CategoryType {
  return c.type ?? 'normal';
}

export const CATEGORY_NAME_MAX = 24;
export const OTHER_CATEGORY_NAME = 'Other';

export interface BudgetSettings {
  id: 'budget';
  balanceKopecks: number | null;
  balanceSetAt: string | null;
  // Stored so the calculation does not depend on the device time zone.
  balanceDate: DateKey | null;
  monthlyIncomeKopecks: number;
  payday: number;
  showFrozen?: boolean;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: BudgetSettings = {
  id: 'budget',
  balanceKopecks: null,
  balanceSetAt: null,
  balanceDate: null,
  monthlyIncomeKopecks: 0,
  payday: 1,
  showFrozen: true,
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export const DEFAULT_CATEGORIES: readonly string[] = ['Food', 'Transport', 'Health', 'Shopping', 'Fun'];

/** Returns an ISO timestamp strictly later than `previous` (guards same-millisecond edits). */
export function nextTimestamp(now: Date, previous?: string): string {
  const prev = previous ? Date.parse(previous) : -Infinity;
  return new Date(Math.max(now.getTime(), prev + 1)).toISOString();
}
