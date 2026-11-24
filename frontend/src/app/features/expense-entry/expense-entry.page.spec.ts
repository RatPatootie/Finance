import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, Router } from '@angular/router';
import { CategoryRepository } from '../../core/db/category.repository';
import { ExpenseRepository } from '../../core/db/expense.repository';
import { FinanceDb } from '../../core/db/finance-db';
import { provideTestDb, until } from '../../core/db/testing';
import { CLOCK } from '../../core/date/clock';
import { Toast } from '../../core/ui/toast';
import { ExpenseEntryPage } from './expense-entry.page';

describe('ExpenseEntryPage', () => {
  let now: Date;
  let db: FinanceDb;
  let toast: { show: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.fn>;

  async function setup() {
    now = new Date('2026-11-23T10:00:00Z'); // 12:00 Kyiv
    const test = provideTestDb();
    db = test.db;
    toast = { show: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        ...test.providers,
        provideRouter([]),
        provideNativeDateAdapter(),
        { provide: CLOCK, useValue: () => now },
        { provide: Toast, useValue: toast },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true) as never;
    await TestBed.inject(CategoryRepository).seedDefaultsIfEmpty();
    const fixture = TestBed.createComponent(ExpenseEntryPage);
    const el = fixture.nativeElement as HTMLElement;
    const categoryButton = (name: string) =>
      [...el.querySelectorAll<HTMLButtonElement>('app-category-grid button')].find((b) => b.textContent!.trim() === name)!;
    await until(
      () => {
        fixture.detectChanges();
        return categoryButton('Food');
      },
      (b) => !!b,
    );
    const press = async (keys: string) => {
      for (const k of keys) el.querySelector<HTMLButtonElement>(`[data-key="${k}"]`)!.click();
      await fixture.whenStable();
    };
    const amountText = () => el.querySelector('[data-testid="amount"]')!.textContent!.trim();
    const isInactive = (b: HTMLButtonElement) => b.getAttribute('aria-disabled') === 'true';
    const waitSaved = async (count: number) => {
      for (let i = 0; i < 200; i++) {
        if ((await db.expenses.count()) >= count) return;
        await new Promise((r) => setTimeout(r, 10));
      }
      throw new Error('waitSaved(): timed out');
    };
    return { fixture, el, page: fixture.componentInstance, categoryButton, press, amountText, isInactive, waitSaved };
  }

  it('shows the categories before typing, inactive, and activates them above zero', async () => {
    const { el, categoryButton, press, isInactive } = await setup();
    const names = [...el.querySelectorAll('app-category-grid button')].map((b) => b.textContent!.trim());
    expect(names).toEqual(['Food', 'Transport', 'Health', 'Shopping', 'Fun']);
    expect(isInactive(categoryButton('Food'))).toBe(true);
    await press('.5');
    expect(isInactive(categoryButton('Food'))).toBe(false);
  });

  it('ignores category taps at zero', async () => {
    const { categoryButton, press } = await setup();
    await press('00.00');
    categoryButton('Food').click();
    await new Promise((r) => setTimeout(r, 50));
    expect(await db.expenses.count()).toBe(0);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('saves amount + category for today, confirms and returns home', async () => {
    const { categoryButton, press, waitSaved } = await setup();
    await press('85');
    categoryButton('Food').click();
    await waitSaved(1);
    await until(
      () => navigate.mock.calls.length,
      (n) => n > 0,
    );
    const stored = await db.expenses.toArray();
    expect(stored[0]).toMatchObject({ amountKopecks: 8500, date: '2026-11-23', isDeleted: 0 });
    expect(toast.show.mock.calls[0][0]).toMatch(/^Saved 85,00.₴ · Food$/);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('close returns home without saving', async () => {
    const { el, press } = await setup();
    await press('40');
    el.querySelector<HTMLButtonElement>('[data-testid="close-entry"]')!.click();
    expect(navigate).toHaveBeenCalledWith('/');
    expect(await db.expenses.count()).toBe(0);
  });

  it('a category tap right after typing saves, before the screen re-renders', async () => {
    const { el, categoryButton, waitSaved } = await setup();
    el.querySelector<HTMLButtonElement>('[data-key="7"]')!.click();
    categoryButton('Food').click();
    await waitSaved(1);
    expect((await db.expenses.toArray())[0].amountKopecks).toBe(700);
  });

  it('a fast double tap stores only one expense', async () => {
    const { categoryButton, press, waitSaved } = await setup();
    await press('40');
    categoryButton('Transport').click();
    categoryButton('Transport').click();
    await waitSaved(1);
    await new Promise((r) => setTimeout(r, 50));
    expect(await db.expenses.count()).toBe(1);
  });

  it('a past date is stored and clearly shown before saving', async () => {
    const { el, page, fixture, categoryButton, press, waitSaved } = await setup();
    (page as unknown as { onDatePicked(d: string): void }).onDatePicked('2026-11-22');
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="date-label"]')!.textContent!.trim()).toBe('Yesterday · Sun 22 Nov');
    await press('60');
    categoryButton('Fun').click();
    await waitSaved(1);
    expect((await db.expenses.toArray())[0]).toMatchObject({ amountKopecks: 6000, date: '2026-11-22' });
  });

  it('a new entry screen starts on today again', async () => {
    const { page } = await setup();
    (page as unknown as { onDatePicked(d: string): void }).onDatePicked('2026-11-22');
    const second = TestBed.createComponent(ExpenseEntryPage);
    await second.whenStable();
    expect((second.nativeElement as HTMLElement).querySelector('[data-testid="date-label"]')!.textContent!.trim()).toBe('Today');
  });

  it('uses the new day after midnight Kyiv time even if the app stayed open', async () => {
    const { categoryButton, press, waitSaved } = await setup();
    now = new Date('2026-11-23T22:30:00Z'); // 00:30 on 24 Nov in Kyiv
    await press('10');
    categoryButton('Food').click();
    await waitSaved(1);
    expect((await db.expenses.toArray())[0].date).toBe('2026-11-24');
  });

  it('keeps the amount, stays open and shows an error when storage fails', async () => {
    const { categoryButton, press, amountText, isInactive, fixture } = await setup();
    vi.spyOn(TestBed.inject(ExpenseRepository), 'add').mockRejectedValue(new Error('QuotaExceeded'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await press('12');
    categoryButton('Health').click();
    await until(
      () => toast.show.mock.calls.length,
      (n) => n > 0,
    );
    await fixture.whenStable();
    expect(amountText()).toBe('12');
    expect(toast.show.mock.calls[0][0]).toMatch(/Couldn't save/);
    expect(navigate).not.toHaveBeenCalled();
    expect(isInactive(categoryButton('Health'))).toBe(false);
  });
});
