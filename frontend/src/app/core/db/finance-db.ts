import { InjectionToken } from '@angular/core';
import Dexie, { DexieOptions, EntityTable } from 'dexie';
import { BudgetSettings, Category, Expense } from './models';

export class FinanceDb extends Dexie {
  expenses!: EntityTable<Expense, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  settings!: EntityTable<BudgetSettings, 'id'>;

  constructor(name = 'finance', options?: DexieOptions) {
    super(name, options);
    this.version(1).stores({
      // First entry is the primary key; the rest are indexes.
      expenses: 'id, date, updatedAt, [isDeleted+date]',
      categories: 'id, sortOrder, updatedAt',
    });
    // Version 2 only adds a table, so existing data is kept with no upgrade step.
    this.version(2).stores({
      settings: 'id',
    });
  }
}

export const FINANCE_DB = new InjectionToken<FinanceDb>('FINANCE_DB', {
  providedIn: 'root',
  factory: () => new FinanceDb(),
});
