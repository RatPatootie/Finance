import Dexie from 'dexie';
import { FinanceDb } from './finance-db';
import { provideTestDb } from './testing';

describe('FinanceDb', () => {
  it('opens version 2 with the expenses, categories and settings tables', async () => {
    const { db } = provideTestDb();
    await db.open();
    expect(db.verno).toBe(2);
    expect(db.tables.map((t) => t.name).sort()).toEqual(['categories', 'expenses', 'settings']);
    expect(db.expenses.schema.indexes.map((i) => i.name)).toEqual(
      expect.arrayContaining(['date', 'updatedAt', '[isDeleted+date]']),
    );
    db.close();
  });

  it('upgrades a version-1 database and keeps its expenses and categories', async () => {
    const name = `upgrade-${Date.now()}`;
    // Build the database exactly as the previous app version did.
    const old = new Dexie(name);
    old.version(1).stores({
      expenses: 'id, date, updatedAt, [isDeleted+date]',
      categories: 'id, sortOrder, updatedAt',
    });
    await old.table('categories').add({ id: 'c1', name: 'Food', sortOrder: 0, isHidden: 0, isDeleted: 0, updatedAt: 'x' });
    await old.table('expenses').add({
      id: 'e1',
      amountKopecks: 258800,
      categoryId: 'c1',
      date: '2026-11-22',
      createdAt: 'x',
      updatedAt: 'x',
      isDeleted: 0,
    });
    old.close();

    const db = new FinanceDb(name);
    await db.open();
    expect(db.verno).toBe(2);
    expect(await db.expenses.get('e1')).toMatchObject({ amountKopecks: 258800 });
    expect(await db.categories.get('c1')).toMatchObject({ name: 'Food' });
    expect(await db.settings.count()).toBe(0);
    db.close();
  });
});
