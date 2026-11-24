import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CategoryRepository } from '../../../core/db/category.repository';
import { ExpenseRepository } from '../../../core/db/expense.repository';
import { FinanceDb } from '../../../core/db/finance-db';
import { Category } from '../../../core/db/models';
import { provideTestDb, until } from '../../../core/db/testing';
import { CategorySheet } from './category.sheet';
import { RemoveCategorySheet } from './remove-category.sheet';

describe('category sheets', () => {
  let db: FinanceDb;
  let repo: CategoryRepository;
  let dismiss: ReturnType<typeof vi.fn>;
  let sheetData: unknown;

  async function setup() {
    const test = provideTestDb();
    db = test.db;
    dismiss = vi.fn();
    TestBed.configureTestingModule({ providers: [
        ...test.providers,
        { provide: MatBottomSheetRef, useValue: { dismiss } },
        { provide: MAT_BOTTOM_SHEET_DATA, useFactory: () => sheetData },
      ],
    });
    repo = TestBed.inject(CategoryRepository);
    await repo.seedDefaultsIfEmpty();
    await until(
      () => repo.listed().length,
      (n) => n === 5,
    );
  }

  function create<T>(component: Type<T>, data: unknown) {
    sheetData = data;
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const q = <E extends HTMLElement>(id: string) => el.querySelector<E>(`[data-testid="${id}"]`);
    const settle = (predicate: () => boolean) =>
      until(
        () => {
          fixture.detectChanges();
          return predicate();
        },
        (ok) => ok,
      );
    return { fixture, el, q, settle };
  }

  const byName = async (name: string) => (await db.categories.toArray()).find((c) => c.name === name && !c.isDeleted) as Category;
  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  describe('CategorySheet', () => {
    it('adds a normal category with a typed name', async () => {
      await setup();
      const { q } = create(CategorySheet, {});
      type(q<HTMLInputElement>('category-name')!, 'Coffee');
      q<HTMLButtonElement>('save-category')!.click();
      await until(() => dismiss.mock.calls.length, (n) => n > 0);
      expect(dismiss).toHaveBeenCalledWith('added');
      expect((await byName('Coffee')).type).toBe('normal');
    });

    it('adds a frozen category', async () => {
      await setup();
      const { q, fixture } = create(CategorySheet, {});
      q<HTMLButtonElement>('type-frozen')!.click();
      fixture.detectChanges();
      expect(q('type-frozen')!.getAttribute('aria-checked')).toBe('true');
      type(q<HTMLInputElement>('category-name')!, 'Vacation');
      q<HTMLButtonElement>('save-category')!.click();
      await until(() => dismiss.mock.calls.length, (n) => n > 0);
      expect((await byName('Vacation')).type).toBe('frozen');
    });

    it('shows a message for a duplicate or empty name and saves nothing', async () => {
      await setup();
      const { q, settle } = create(CategorySheet, {});
      type(q<HTMLInputElement>('category-name')!, ' food ');
      q<HTMLButtonElement>('save-category')!.click();
      await settle(() => !!q('category-error'));
      expect(q('category-error')!.textContent).toContain('already used');
      type(q<HTMLInputElement>('category-name')!, '   ');
      q<HTMLButtonElement>('save-category')!.click();
      await settle(() => q('category-error')?.textContent?.includes('Enter a name') ?? false);
      expect(dismiss).not.toHaveBeenCalled();
      expect(await db.categories.count()).toBe(5);
    });

    it('renames; the type is shown and cannot be changed; Remove hands back to the page', async () => {
      await setup();
      const fun = await byName('Fun');
      const { q } = create(CategorySheet, { category: fun });
      expect(q<HTMLInputElement>('category-name')!.value).toBe('Fun');
      expect(q('category-type')!.textContent).toContain('Normal');
      expect(q('type-frozen')).toBeNull();
      type(q<HTMLInputElement>('category-name')!, 'Going out');
      q<HTMLButtonElement>('save-category')!.click();
      await until(() => dismiss.mock.calls.length, (n) => n > 0);
      expect(dismiss).toHaveBeenCalledWith('renamed');
      expect((await db.categories.get(fun.id))!.name).toBe('Going out');

      q<HTMLButtonElement>('remove-category')!.click();
      expect(dismiss).toHaveBeenLastCalledWith('remove');
    });
  });

  describe('RemoveCategorySheet', () => {
    const targets = (el: HTMLElement) =>
      [...el.querySelectorAll('[role="radio"]')].map((b) => `${b.getAttribute('data-target')}${b.getAttribute('aria-checked') === 'true' ? '*' : ''}`);

    async function withExpenses(name: string, n: number) {
      const category = await byName(name);
      const expenses = TestBed.inject(ExpenseRepository);
      for (let i = 0; i < n; i++) await expenses.add({ amountKopecks: 100, categoryId: category.id, date: '2026-11-24' });
      return category;
    }

    it('confirms a category with no expenses', async () => {
      await setup();
      const coffee = await repo.add('Coffee', 'normal');
      const { el, q } = create(RemoveCategorySheet, { category: coffee, count: 0 });
      expect(el.textContent).toContain('It has no expenses.');
      q<HTMLButtonElement>('confirm-remove')!.click();
      await until(() => dismiss.mock.calls.length, (n) => n > 0);
      expect(dismiss).toHaveBeenCalledWith('removed');
      expect((await db.categories.get(coffee.id))!.isDeleted).toBe(1);
    });

    it('offers "Other (new)" first by default and moves the records there', async () => {
      await setup();
      const fun = await withExpenses('Fun', 12);
      const { el, q } = create(RemoveCategorySheet, { category: fun, count: 12 });
      expect(q('remove-count')!.textContent).toContain('12 records');
      expect(targets(el)).toEqual(['Other (new)*', 'Food', 'Transport', 'Health', 'Shopping']);
      q<HTMLButtonElement>('confirm-remove')!.click();
      await until(() => dismiss.mock.calls.length, (n) => n > 0);
      const other = await byName('Other');
      expect((await db.expenses.toArray()).every((e) => e.categoryId === other.id)).toBe(true);
    });

    it('moves to a picked category', async () => {
      await setup();
      const fun = await withExpenses('Fun', 3);
      const { el, q, fixture } = create(RemoveCategorySheet, { category: fun, count: 3 });
      el.querySelector<HTMLButtonElement>('[data-target="Shopping"]')!.click();
      fixture.detectChanges();
      expect(targets(el)).toContain('Shopping*');
      q<HTMLButtonElement>('confirm-remove')!.click();
      await until(() => dismiss.mock.calls.length, (n) => n > 0);
      const shopping = await byName('Shopping');
      expect((await db.expenses.toArray()).every((e) => e.categoryId === shopping.id)).toBe(true);
    });

    it('offers only other frozen categories, and blocks when there is none', async () => {
      await setup();
      const vacation = await repo.add('Vacation', 'frozen');
      await TestBed.inject(ExpenseRepository).add({ amountKopecks: 100, categoryId: vacation.id, date: '2026-11-24' });
      const first = create(RemoveCategorySheet, { category: vacation, count: 1 });
      expect(first.q('remove-blocked')).not.toBeNull();
      expect(first.q('confirm-remove')).toBeNull();

      TestBed.resetTestingModule();
      await setup();
      const v2 = await repo.add('Vacation', 'frozen');
      await repo.add('Deposit', 'frozen');
      await until(
        () => repo.listed().length,
        (n) => n === 7,
      );
      const second = create(RemoveCategorySheet, { category: v2, count: 1 });
      expect(targets(second.el)).toEqual(['Deposit*']);
    });

    it('does not offer "Other" when removing "Other" itself', async () => {
      await setup();
      const other = await repo.add('Other', 'normal');
      await until(
        () => repo.listed().length,
        (n) => n === 6,
      );
      const { el } = create(RemoveCategorySheet, { category: other, count: 2 });
      expect(targets(el)).toEqual(['Food*', 'Transport', 'Health', 'Shopping', 'Fun']);
    });

    it('cancel changes nothing', async () => {
      await setup();
      const fun = await withExpenses('Fun', 3);
      const { q } = create(RemoveCategorySheet, { category: fun, count: 3 });
      q<HTMLButtonElement>('cancel-remove')!.click();
      expect(dismiss).toHaveBeenCalledWith(undefined);
      expect((await db.categories.get(fun.id))!.isDeleted).toBe(0);
    });
  });
});
