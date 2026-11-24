import { TestBed } from '@angular/core/testing';
import { CategoryRepository } from './category.repository';
import { provideTestDb, until } from './testing';

describe('CategoryRepository', () => {
  function setup() {
    const { db, providers } = provideTestDb();
    TestBed.configureTestingModule({ providers });
    return { db, repo: TestBed.inject(CategoryRepository) };
  }

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
