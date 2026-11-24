import { inject, Injectable } from '@angular/core';
import { liveQuery } from 'dexie';
import { from, Observable } from 'rxjs';
import { CLOCK } from '../date/clock';
import { DateKey } from '../date/kyiv-date';
import { FINANCE_DB } from './finance-db';
import { Expense, nextTimestamp } from './models';

export interface NewExpense {
  amountKopecks: number;
  categoryId: string;
  date: DateKey;
  kind?: 'return';
}

export type ExpenseChanges = Partial<Omit<NewExpense, 'kind'>>;

@Injectable({ providedIn: 'root' })
export class ExpenseRepository {
  private readonly db = inject(FINANCE_DB);
  private readonly clock = inject(CLOCK);

  forDate$(date: DateKey): Observable<Expense[]> {
    return from(
      liveQuery(async () => {
        const items = await this.db.expenses.where('[isDeleted+date]').equals([0, date]).sortBy('createdAt');
        return items.reverse();
      }),
    );
  }

  between$(start: DateKey, end: DateKey): Observable<Expense[]> {
    return from(
      liveQuery(async () => {
        const items = await this.db.expenses.where('[isDeleted+date]').between([0, start], [0, end], true, true).sortBy('createdAt');
        return items.reverse();
      }),
    );
  }

  since$(date: DateKey): Observable<Expense[]> {
    return from(liveQuery(() => this.db.expenses.where('date').aboveOrEqual(date).toArray()));
  }

  inCategories$(ids: readonly string[]): Observable<Expense[]> {
    const set = new Set(ids);
    return from(liveQuery(() => (set.size ? this.db.expenses.filter((e) => set.has(e.categoryId)).toArray() : [])));
  }

  countInCategory(categoryId: string): Promise<number> {
    return this.db.expenses.filter((e) => e.categoryId === categoryId).count();
  }

  async moveCategory(fromId: string, toId: string): Promise<void> {
    const now = this.clock();
    await this.db.expenses
      .filter((e) => e.categoryId === fromId)
      .modify((e) => {
        e.categoryId = toId;
        e.updatedAt = nextTimestamp(now, e.updatedAt);
      });
  }

  get(id: string): Promise<Expense | undefined> {
    return this.db.expenses.get(id);
  }

  async add(input: NewExpense): Promise<Expense> {
    assertAmount(input.amountKopecks);
    const now = this.clock().toISOString();
    const expense: Expense = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now, isDeleted: 0 };
    await this.db.expenses.add(expense);
    return expense;
  }

  async update(id: string, changes: ExpenseChanges): Promise<void> {
    if (changes.amountKopecks !== undefined) assertAmount(changes.amountKopecks);
    await this.patch(id, changes);
  }

  softDelete(id: string): Promise<void> {
    return this.patch(id, { isDeleted: 1 });
  }

  restore(id: string): Promise<void> {
    return this.patch(id, { isDeleted: 0 });
  }

  private async patch(id: string, changes: Partial<Expense>): Promise<void> {
    await this.db.transaction('rw', this.db.expenses, async () => {
      const current = await this.db.expenses.get(id);
      if (!current) throw new Error(`Expense ${id} not found`);
      await this.db.expenses.put({
        ...current,
        ...changes,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: nextTimestamp(this.clock(), current.updatedAt),
      });
    });
  }
}

function assertAmount(kopecks: number): void {
  if (!Number.isInteger(kopecks) || kopecks <= 0) {
    throw new Error('Amount must be a positive whole number of kopecks');
  }
}

export function sumKopecks(expenses: readonly Pick<Expense, 'amountKopecks'>[]): number {
  return expenses.reduce((sum, e) => sum + e.amountKopecks, 0);
}
