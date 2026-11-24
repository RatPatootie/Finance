import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { CLOCK } from '../date/clock';
import { ExpenseRepository } from './expense.repository';
import { FINANCE_DB } from './finance-db';
import {
  Category,
  CATEGORY_NAME_MAX,
  CategoryType,
  categoryType,
  DEFAULT_CATEGORIES,
  nextTimestamp,
  OTHER_CATEGORY_NAME,
} from './models';

export type CategoryNameProblem = 'empty' | 'too-long' | 'duplicate';

export class CategoryNameError extends Error {
  constructor(readonly problem: CategoryNameProblem) {
    super(`Invalid category name: ${problem}`);
  }
}

export class CategoryRemoveError extends Error {}

export type RemoveTarget = string | 'other';

@Injectable({ providedIn: 'root' })
export class CategoryRepository {
  private readonly db = inject(FINANCE_DB);
  private readonly clock = inject(CLOCK);
  private readonly expenses = inject(ExpenseRepository);

  readonly all: Signal<Category[]> = toSignal(
    from(liveQuery(() => this.db.categories.orderBy('sortOrder').toArray())),
    { initialValue: [] },
  );

  readonly listed = computed(() => this.all().filter((c) => !c.isDeleted));

  readonly active = computed(() => this.listed().filter((c) => !c.isHidden));

  readonly forEntry = computed(() => {
    const active = this.active();
    return [...active.filter((c) => categoryType(c) === 'normal'), ...active.filter((c) => categoryType(c) === 'frozen')];
  });

  private readonly map = computed(() => new Map(this.all().map((c) => [c.id, c])));

  byId(id: string): Category | undefined {
    return this.map().get(id);
  }

  async seedDefaultsIfEmpty(): Promise<void> {
    await this.db.transaction('rw', this.db.categories, async () => {
      if ((await this.db.categories.count()) > 0) return;
      const updatedAt = this.clock().toISOString();
      await this.db.categories.bulkAdd(
        DEFAULT_CATEGORIES.map((name, i) => ({
          id: crypto.randomUUID(),
          name,
          sortOrder: i,
          type: 'normal' as const,
          isHidden: 0 as const,
          isDeleted: 0 as const,
          updatedAt,
        })),
      );
    });
  }

  async add(name: string, type: CategoryType): Promise<Category> {
    return this.db.transaction('rw', this.db.categories, async () => {
      const clean = await this.validName(name);
      return this.insert(clean, type);
    });
  }

  async rename(id: string, name: string): Promise<void> {
    await this.db.transaction('rw', this.db.categories, async () => {
      const current = await this.db.categories.get(id);
      if (!current || current.isDeleted) throw new Error(`Category ${id} not found`);
      const clean = await this.validName(name, id);
      await this.db.categories.put({ ...current, name: clean, updatedAt: nextTimestamp(this.clock(), current.updatedAt) });
    });
  }

  countExpenses(id: string): Promise<number> {
    return this.expenses.countInCategory(id);
  }

  // Deleted expenses move too, so an undo or a later sync never points at a removed category.
  async remove(id: string, target?: RemoveTarget): Promise<void> {
    await this.db.transaction('rw', this.db.categories, this.db.expenses, async () => {
      const current = await this.db.categories.get(id);
      if (!current || current.isDeleted) throw new Error(`Category ${id} not found`);
      if ((await this.expenses.countInCategory(id)) > 0) {
        if (!target) throw new CategoryRemoveError('A category with expenses needs a target');
        const to = target === 'other' ? await this.ensureOtherIn(current) : await this.db.categories.get(target);
        if (!to || to.isDeleted || to.id === id || categoryType(to) !== categoryType(current)) {
          throw new CategoryRemoveError('Invalid target category');
        }
        await this.expenses.moveCategory(id, to.id);
      }
      await this.db.categories.put({ ...current, isDeleted: 1, updatedAt: nextTimestamp(this.clock(), current.updatedAt) });
    });
  }

  findOther(): Category | undefined {
    return this.listed().find((c) => categoryType(c) === 'normal' && c.name.toLowerCase() === OTHER_CATEGORY_NAME.toLowerCase());
  }

  private async ensureOtherIn(removing: Category): Promise<Category> {
    if (categoryType(removing) !== 'normal') throw new CategoryRemoveError('"Other" only takes normal categories');
    const existing = (await this.db.categories.toArray()).find(
      (c) => !c.isDeleted && categoryType(c) === 'normal' && c.name.toLowerCase() === OTHER_CATEGORY_NAME.toLowerCase(),
    );
    if (existing) return existing;
    return this.insert(OTHER_CATEGORY_NAME, 'normal');
  }

  private async insert(name: string, type: CategoryType): Promise<Category> {
    const last = await this.db.categories.orderBy('sortOrder').last();
    const category: Category = {
      id: crypto.randomUUID(),
      name,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      type,
      isHidden: 0,
      isDeleted: 0,
      updatedAt: this.clock().toISOString(),
    };
    await this.db.categories.add(category);
    return category;
  }

  private async validName(name: string, exceptId?: string): Promise<string> {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) throw new CategoryNameError('empty');
    if (clean.length > CATEGORY_NAME_MAX) throw new CategoryNameError('too-long');
    const taken = (await this.db.categories.toArray()).some(
      (c) => !c.isDeleted && c.id !== exceptId && c.name.toLowerCase() === clean.toLowerCase(),
    );
    if (taken) throw new CategoryNameError('duplicate');
    return clean;
  }
}
