import { TestBed } from '@angular/core/testing';
import { CLOCK } from '../date/clock';
import { ExpenseRepository, sumKopecks } from './expense.repository';
import { provideTestDb, waitFor } from './testing';

describe('ExpenseRepository', () => {
  let now: Date;

  function setup() {
    now = new Date('2026-11-23T10:00:00Z');
    const { db, providers } = provideTestDb();
    TestBed.configureTestingModule({
      providers: [...providers, { provide: CLOCK, useValue: () => now }],
    });
    return { db, repo: TestBed.inject(ExpenseRepository) };
  }

  it('add stores a record with sync fields', async () => {
    const { db, repo } = setup();
    const e = await repo.add({ amountKopecks: 8500, categoryId: 'food', date: '2026-11-23' });
    const stored = await db.expenses.get(e.id);
    expect(stored).toEqual({
      id: e.id,
      amountKopecks: 8500,
      categoryId: 'food',
      date: '2026-11-23',
      createdAt: '2026-11-23T10:00:00.000Z',
      updatedAt: '2026-11-23T10:00:00.000Z',
      isDeleted: 0,
    });
  });

  it('rejects zero, negative and fractional amounts', async () => {
    const { repo } = setup();
    await expect(repo.add({ amountKopecks: 0, categoryId: 'x', date: '2026-11-23' })).rejects.toThrow();
    await expect(repo.add({ amountKopecks: -1, categoryId: 'x', date: '2026-11-23' })).rejects.toThrow();
    await expect(repo.add({ amountKopecks: 1.5, categoryId: 'x', date: '2026-11-23' })).rejects.toThrow();
  });

  it('update bumps updatedAt and keeps id and createdAt', async () => {
    const { db, repo } = setup();
    const e = await repo.add({ amountKopecks: 8500, categoryId: 'food', date: '2026-11-23' });
    now = new Date('2026-11-23T11:00:00Z');
    await repo.update(e.id, { amountKopecks: 5800, categoryId: 'fun' });
    const stored = (await db.expenses.get(e.id))!;
    expect(stored.amountKopecks).toBe(5800);
    expect(stored.categoryId).toBe('fun');
    expect(stored.id).toBe(e.id);
    expect(stored.createdAt).toBe(e.createdAt);
    expect(stored.updatedAt).toBe('2026-11-23T11:00:00.000Z');
  });

  it('update in the same millisecond still moves updatedAt forward', async () => {
    const { db, repo } = setup();
    const e = await repo.add({ amountKopecks: 100, categoryId: 'food', date: '2026-11-23' });
    await repo.update(e.id, { amountKopecks: 200 });
    expect((await db.expenses.get(e.id))!.updatedAt > e.updatedAt).toBe(true);
  });

  it('softDelete keeps the record marked deleted; restore brings it back', async () => {
    const { db, repo } = setup();
    const e = await repo.add({ amountKopecks: 4000, categoryId: 'tr', date: '2026-11-23' });
    await repo.softDelete(e.id);
    expect((await db.expenses.get(e.id))!.isDeleted).toBe(1);
    await repo.restore(e.id);
    expect((await db.expenses.get(e.id))!.isDeleted).toBe(0);
  });

  it('forDate$ lists one day, newest first, without deleted ones', async () => {
    const { repo } = setup();
    const a = await repo.add({ amountKopecks: 8500, categoryId: 'food', date: '2026-11-23' });
    now = new Date('2026-11-23T10:05:00Z');
    const b = await repo.add({ amountKopecks: 4000, categoryId: 'tr', date: '2026-11-23' });
    now = new Date('2026-11-23T10:06:00Z');
    await repo.add({ amountKopecks: 6000, categoryId: 'fun', date: '2026-11-22' });
    const c = await repo.add({ amountKopecks: 100, categoryId: 'fun', date: '2026-11-23' });
    await repo.softDelete(c.id);

    const list = await waitFor(repo.forDate$('2026-11-23'), (l) => l.length > 0);
    expect(list.map((e) => e.id)).toEqual([b.id, a.id]);
  });
});

describe('sumKopecks', () => {
  it('is 0 for an empty list', () => {
    expect(sumKopecks([])).toBe(0);
  });

  it('adds amounts', () => {
    expect(sumKopecks([{ amountKopecks: 8500 }, { amountKopecks: 4000 }])).toBe(12500);
  });
});
