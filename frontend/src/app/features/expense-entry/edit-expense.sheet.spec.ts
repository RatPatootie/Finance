import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CategoryRepository } from '../../core/db/category.repository';
import { ExpenseRepository } from '../../core/db/expense.repository';
import { FinanceDb } from '../../core/db/finance-db';
import { Expense } from '../../core/db/models';
import { provideTestDb, until } from '../../core/db/testing';
import { CLOCK } from '../../core/date/clock';
import { EditExpenseSheet } from './edit-expense.sheet';

describe('EditExpenseSheet', () => {
  let db: FinanceDb;
  let dismiss: ReturnType<typeof vi.fn>;

  async function setup() {
    let now = new Date('2026-11-23T10:00:00Z');
    const test = provideTestDb();
    db = test.db;
    dismiss = vi.fn();
    let data: Expense | undefined;
    TestBed.configureTestingModule({
      providers: [
        ...test.providers,
        provideNativeDateAdapter(),
        { provide: CLOCK, useValue: () => now },
        // Read lazily: the expense is created after the module is set up.
        { provide: MAT_BOTTOM_SHEET_DATA, useFactory: () => data },
        { provide: MatBottomSheetRef, useValue: { dismiss } },
      ],
    });
    const categories = TestBed.inject(CategoryRepository);
    await categories.seedDefaultsIfEmpty();
    const cats = await db.categories.orderBy('sortOrder').toArray();
    const food = cats.find((c) => c.name === 'Food')!;
    const expense = await TestBed.inject(ExpenseRepository).add({ amountKopecks: 8500, categoryId: food.id, date: '2026-11-23' });
    now = new Date('2026-11-23T11:00:00Z');

    data = expense;
    const fixture = TestBed.createComponent(EditExpenseSheet);
    const el = fixture.nativeElement as HTMLElement;
    await until(
      () => {
        fixture.detectChanges();
        return el.querySelectorAll('app-category-grid button').length;
      },
      (n) => n === 5,
    );
    const press = async (keys: string) => {
      for (const k of keys) el.querySelector<HTMLButtonElement>(`[data-key="${k === '<' ? 'back' : k}"]`)!.click();
      await fixture.whenStable();
    };
    const saveButton = () => el.querySelector<HTMLButtonElement>('[data-testid="save-edit"]')!;
    const stored = async () => (await db.expenses.get(expense.id)) as Expense;
    return { fixture, el, expense, cats, press, saveButton, stored };
  }

  it('starts with the current amount and category selected', async () => {
    const { el } = await setup();
    expect(el.querySelector('[data-testid="amount"]')!.textContent!.trim()).toBe('85');
    expect(el.querySelector('.cat.selected')!.textContent!.trim()).toBe('Food');
  });

  it('saves a changed amount and category', async () => {
    const { el, press, saveButton, stored, expense } = await setup();
    await press('<<58');
    [...el.querySelectorAll<HTMLButtonElement>('app-category-grid button')].find((b) => b.textContent!.trim() === 'Fun')!.click();
    await press('');
    saveButton().click();
    await until(
      () => dismiss.mock.calls.length,
      (n) => n > 0,
    );
    expect(dismiss).toHaveBeenCalledWith('saved');
    const s = await stored();
    expect(s.amountKopecks).toBe(5800);
    expect(s.categoryId).not.toBe(expense.categoryId);
    expect(s.createdAt).toBe(expense.createdAt);
    expect(s.updatedAt > expense.updatedAt).toBe(true);
  });

  it('moving the date to yesterday is saved', async () => {
    const { fixture, saveButton, stored } = await setup();
    (fixture.componentInstance as unknown as { date: { set(v: string): void } }).date.set('2026-11-22');
    await fixture.whenStable();
    saveButton().click();
    await until(
      () => dismiss.mock.calls.length,
      (n) => n > 0,
    );
    expect((await stored()).date).toBe('2026-11-22');
  });

  it('disables Save when the amount is cleared', async () => {
    const { press, saveButton } = await setup();
    await press('<<');
    expect(saveButton().disabled).toBe(true);
  });

  it('cancel leaves the record unchanged', async () => {
    const { el, press, stored, expense } = await setup();
    await press('<<1');
    [...el.querySelectorAll<HTMLButtonElement>('.actions button')].find((b) => b.textContent!.trim() === 'Cancel')!.click();
    expect(dismiss).toHaveBeenCalledWith(undefined);
    expect(await stored()).toEqual(expense);
  });
});
