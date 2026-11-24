import { TestBed } from '@angular/core/testing';
import { CategoryNameError, CategoryRemoveError, CategoryRepository } from './category.repository';
import { ExpenseRepository } from './expense.repository';
import { categoryType } from './models';
import { provideTestDb, until } from './testing';

describe('CategoryRepository', () => {
  function setup() {
    const { db, providers } = provideTestDb();
    TestBed.configureTestingModule({ providers });
    return { db, repo: TestBed.inject(CategoryRepository), expenses: TestBed.inject(ExpenseRepository) };
  }

  async function seeded() {
    const s = setup();
    await s.repo.seedDefaultsIfEmpty();
    const id = async (name: string) => (await s.db.categories.toArray()).find((c) => c.name === name)!.id;
    const addExpenses = async (category: string, n: number) => {
      const categoryId = await id(category);
      for (let i = 0; i < n; i++) await s.expenses.add({ amountKopecks: 100 * (i + 1), categoryId, date: '2026-11-24' });
    };
    return { ...s, id, addExpenses };
  }

  it('old categories without a type read as normal', () => {
    expect(categoryType({})).toBe('normal');
    expect(categoryType({ type: 'frozen' })).toBe('frozen');
  });

  it('adds normal and frozen categories at the end', async () => {
    const { db, repo } = await seeded();
    await repo.add('  Coffee ', 'normal');
    await repo.add('Vacation', 'frozen');
    const rows = await db.categories.orderBy('sortOrder').toArray();
    expect(rows.slice(-2).map((c) => [c.name, c.type])).toEqual([
      ['Coffee', 'normal'],
      ['Vacation', 'frozen'],
    ]);
  });

  it('rejects empty, too long and duplicate names, ignoring case and spaces', async () => {
    const { repo } = await seeded();
    const problem = (p: Promise<unknown>) => p.then(() => 'ok', (e: CategoryNameError) => e.problem);
    expect(await problem(repo.add('   ', 'normal'))).toBe('empty');
    expect(await problem(repo.add('x'.repeat(25), 'normal'))).toBe('too-long');
    expect(await problem(repo.add(' food ', 'normal'))).toBe('duplicate');
    expect(await problem(repo.add('x'.repeat(24), 'normal'))).toBe('ok');
  });

  it('renames and keeps the id; the same name with other case is fine for itself', async () => {
    const { db, repo, id } = await seeded();
    const fun = await id('Fun');
    await repo.rename(fun, 'Going out');
    expect((await db.categories.get(fun))!.name).toBe('Going out');
    await repo.rename(fun, 'going OUT');
    await expect(repo.rename(fun, 'Food')).rejects.toBeInstanceOf(CategoryNameError);
  });

  it('removes an unused category as a soft delete; its name can be reused', async () => {
    const { db, repo } = await seeded();
    const coffee = await repo.add('Coffee', 'normal');
    await repo.remove(coffee.id);
    expect(await db.categories.get(coffee.id)).toMatchObject({ isDeleted: 1 });
    await until(
      () => repo.active().map((c) => c.name),
      (names) => !names.includes('Coffee'),
    );
    await repo.add('Coffee', 'normal');
  });

  it('moves expenses to a new "Other" by default, deleted ones included', async () => {
    const { db, repo, expenses, id, addExpenses } = await seeded();
    await addExpenses('Fun', 3);
    const fun = await id('Fun');
    const [first] = await db.expenses.toArray();
    await expenses.softDelete(first.id);
    expect(await repo.countExpenses(fun)).toBe(3);

    await repo.remove(fun, 'other');
    const other = (await db.categories.toArray()).find((c) => c.name === 'Other')!;
    expect(categoryType(other)).toBe('normal');
    const moved = await db.expenses.toArray();
    expect(moved.every((e) => e.categoryId === other.id)).toBe(true);
    expect(moved.every((e) => e.updatedAt > e.createdAt)).toBe(true);
    expect(await db.categories.get(fun)).toMatchObject({ isDeleted: 1 });
  });

  it('reuses an existing "Other" and moves to a chosen category', async () => {
    const { db, repo, id, addExpenses } = await seeded();
    await repo.add('other', 'normal');
    await addExpenses('Fun', 2);
    await repo.remove(await id('Fun'), 'other');
    expect((await db.categories.toArray()).filter((c) => c.name.toLowerCase() === 'other')).toHaveLength(1);

    await addExpenses('Health', 1);
    const shopping = await id('Shopping');
    await repo.remove(await id('Health'), shopping);
    expect((await db.expenses.toArray()).filter((e) => e.categoryId === shopping)).toHaveLength(1);
  });

  it('refuses a missing, same, deleted or other-type target and changes nothing', async () => {
    const { db, repo, id, addExpenses } = await seeded();
    const vacation = await repo.add('Vacation', 'frozen');
    await addExpenses('Fun', 1);
    const fun = await id('Fun');
    await expect(repo.remove(fun)).rejects.toBeInstanceOf(CategoryRemoveError);
    await expect(repo.remove(fun, fun)).rejects.toBeInstanceOf(CategoryRemoveError);
    await expect(repo.remove(fun, vacation.id)).rejects.toBeInstanceOf(CategoryRemoveError);
    expect(await db.categories.get(fun)).toMatchObject({ isDeleted: 0 });
    expect((await db.expenses.toArray())[0].categoryId).toBe(fun);
  });

  it('a frozen category cannot be moved into "Other"', async () => {
    const { db, repo, expenses } = await seeded();
    const vacation = await repo.add('Vacation', 'frozen');
    await expenses.add({ amountKopecks: 1000, categoryId: vacation.id, date: '2026-11-24' });
    await expect(repo.remove(vacation.id, 'other')).rejects.toBeInstanceOf(CategoryRemoveError);
    expect((await db.categories.toArray()).some((c) => c.name === 'Other')).toBe(false);
  });

  it('seeds the five defaults in order with sync fields', async () => {
    const { db, repo } = setup();
    await repo.seedDefaultsIfEmpty();
    const rows = await db.categories.orderBy('sortOrder').toArray();
    expect(rows.map((c) => c.name)).toEqual(['Food', 'Transport', 'Health', 'Shopping', 'Fun']);
    expect(new Set(rows.map((c) => c.id)).size).toBe(5);
    for (const c of rows) {
      expect(c.isHidden).toBe(0);
      expect(c.isDeleted).toBe(0);
      expect(c.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('does not seed twice', async () => {
    const { db, repo } = setup();
    await repo.seedDefaultsIfEmpty();
    await repo.seedDefaultsIfEmpty();
    await Promise.all([repo.seedDefaultsIfEmpty(), repo.seedDefaultsIfEmpty()]);
    expect(await db.categories.count()).toBe(5);
  });

  it('active excludes hidden categories but byId still finds them', async () => {
    const { db, repo } = setup();
    await repo.seedDefaultsIfEmpty();
    const fun = (await db.categories.toArray()).find((c) => c.name === 'Fun')!;
    await db.categories.update(fun.id, { isHidden: 1 });

    const active = await until(
      () => repo.active(),
      (list) => list.length === 4,
    );
    expect(active.map((c) => c.name)).toEqual(['Food', 'Transport', 'Health', 'Shopping']);
    expect(repo.byId(fun.id)?.name).toBe('Fun');
  });
});
