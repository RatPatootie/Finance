import { TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { CLOCK } from '../../core/date/clock';
import { CategoryRepository } from '../../core/db/category.repository';
import { ExpenseRepository } from '../../core/db/expense.repository';
import { FinanceDb } from '../../core/db/finance-db';
import { SettingsRepository } from '../../core/db/settings.repository';
import { provideTestDb, until } from '../../core/db/testing';
import { Toast } from '../../core/ui/toast';
import { AmountSheet } from './amount.sheet';
import { CategorySheet } from './categories/category.sheet';
import { RemoveCategorySheet } from './categories/remove-category.sheet';
import { PaydaySheet } from './payday.sheet';
import { PercentSheet } from './percent.sheet';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  let db: FinanceDb;
  /** What the next sheet "returns" when dismissed. */
  let sheetResult: unknown;
  let open: ReturnType<typeof vi.fn>;

  async function setup(prepare?: (repo: SettingsRepository) => Promise<void>) {
    const now = new Date('2026-11-24T07:00:00Z');
    const test = provideTestDb();
    db = test.db;
    open = vi.fn(() => ({ afterDismissed: () => of(sheetResult) }));
    TestBed.configureTestingModule({
      providers: [
        ...test.providers,
        provideRouter([]),
        { provide: CLOCK, useValue: () => now },
        { provide: Toast, useValue: { show: vi.fn() } },
        { provide: MatBottomSheet, useValue: { open } },
      ],
    });
    const repo = TestBed.inject(SettingsRepository);
    if (prepare) await prepare(repo);
    const fixture = TestBed.createComponent(SettingsPage);
    const el = fixture.nativeElement as HTMLElement;
    const text = (id: string) =>
      el.querySelector(`[data-testid="${id}"] .value`)!.textContent!.replace(/[  ]/g, ' ').trim();
    const settle = (predicate: () => boolean) =>
      until(
        () => {
          fixture.detectChanges();
          return predicate();
        },
        (ok) => ok,
      );
    const tap = (id: string) => el.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!.click();
    const stored = async () => (await db.settings.get('budget'))!;
    const waitStored = (predicate: (s: Awaited<ReturnType<typeof stored>>) => boolean) =>
      (async () => {
        for (let i = 0; i < 200; i++) {
          const s = await db.settings.get('budget');
          if (s && predicate(s)) return;
          await new Promise((r) => setTimeout(r, 10));
        }
        throw new Error('waitStored(): timed out');
      })();
    await settle(() => text('row-payday') !== '');
    return { el, text, settle, tap, stored, waitStored };
  }

  it('shows "Not set", income 0 and payday 1 before set-up', async () => {
    const { text, settle } = await setup();
    await settle(() => text('row-balance') === 'Not set');
    expect(text('row-income')).toBe('0,00 ₴');
    expect(text('row-payday')).toBe('Day 1');
  });

  it('back returns home', async () => {
    const { tap } = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    tap('back');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('sets the balance and shows it', async () => {
    const { text, settle, tap, waitStored } = await setup();
    sheetResult = 1_200_000;
    tap('row-balance');
    expect(open).toHaveBeenCalledWith(AmountSheet, expect.objectContaining({ data: { title: 'Balance now', kopecks: null } }));
    await waitStored((s) => s.balanceKopecks === 1_200_000);
    await settle(() => text('row-balance') === '12 000,00 ₴');
  });

  it('opens the income sheet prefilled; cancel keeps the old value', async () => {
    const { tap, stored, text, settle } = await setup((r) => r.setMonthlyIncome(3_000_000));
    await settle(() => text('row-income') === '30 000,00 ₴');
    sheetResult = undefined;
    tap('row-income');
    expect(open.mock.calls[0][1].data).toEqual({ title: 'Monthly income', kopecks: 3_000_000 });
    await new Promise((r) => setTimeout(r, 30));
    expect((await stored()).monthlyIncomeKopecks).toBe(3_000_000);
  });

  it('saves 0 as the income', async () => {
    const { tap, waitStored } = await setup((r) => r.setMonthlyIncome(3_000_000));
    sheetResult = 0;
    tap('row-income');
    await waitStored((s) => s.monthlyIncomeKopecks === 0);
  });

  it('picks payday 25', async () => {
    const { text, settle, tap, waitStored } = await setup();
    sheetResult = 25;
    tap('row-payday');
    expect(open).toHaveBeenCalledWith(PaydaySheet, expect.objectContaining({ data: 1 }));
    await waitStored((s) => s.payday === 25);
    await settle(() => text('row-payday') === 'Day 25');
  });

  describe('categories', () => {
    const seed = async () => {
      const repo = TestBed.inject(CategoryRepository);
      await repo.seedDefaultsIfEmpty();
      return repo;
    };
    const rows = (el: HTMLElement) =>
      [...el.querySelectorAll('[data-testid="category-row"]')].map(
        (r) => `${r.querySelector('.name')!.textContent!.trim()} ${r.querySelector('.tag')!.textContent!.trim()}`,
      );

    it('lists the categories in order with their type', async () => {
      const { el, settle } = await setup();
      const repo = await seed();
      await repo.add('Vacation', 'frozen');
      await settle(() => rows(el).length === 6);
      expect(rows(el)).toEqual(['Food Normal', 'Transport Normal', 'Health Normal', 'Shopping Normal', 'Fun Normal', 'Vacation Frozen']);
    });

    it('Add category opens the category sheet', async () => {
      const { tap } = await setup();
      sheetResult = 'added';
      tap('add-category');
      expect(open).toHaveBeenCalledWith(CategorySheet, expect.objectContaining({ data: {} }));
    });

    it('Remove from the edit sheet opens the remove dialog with the record count', async () => {
      const { el, settle } = await setup();
      const repo = await seed();
      await settle(() => rows(el).length === 5);
      const fun = repo.listed().find((c) => c.name === 'Fun')!;
      const expenses = TestBed.inject(ExpenseRepository);
      for (let i = 0; i < 2; i++) await expenses.add({ amountKopecks: 100, categoryId: fun.id, date: '2026-11-24' });
      open.mockReturnValueOnce({ afterDismissed: () => of('remove') });
      open.mockReturnValueOnce({ afterDismissed: () => of(undefined) });
      [...el.querySelectorAll<HTMLButtonElement>('[data-testid="category-row"]')][4].click();
      await until(
        () => open.mock.calls.length,
        (n) => n === 2,
      );
      expect(open.mock.calls[0][0]).toBe(CategorySheet);
      expect(open.mock.calls[1][0]).toBe(RemoveCategorySheet);
      expect(open.mock.calls[1][1].data).toEqual({ category: expect.objectContaining({ name: 'Fun' }), count: 2 });
    });
  });

  describe('frozen money', () => {
    it('lists frozen categories with totals; Return takes up to the total and records a return', async () => {
      const { el, settle } = await setup((r) => r.setBalance(1_200_000));
      const categories = TestBed.inject(CategoryRepository);
      await categories.seedDefaultsIfEmpty();
      const vacation = await categories.add('Vacation', 'frozen');
      await TestBed.inject(ExpenseRepository).add({ amountKopecks: 200_000, categoryId: vacation.id, date: '2026-11-24' });
      const row = () => el.querySelector<HTMLButtonElement>('[data-testid="frozen-row"]');
      await settle(() => !!row() && row()!.textContent!.replace(/[\u00a0\u202f]/g, ' ').includes('2 000,00 ₴'));
      sheetResult = 50_000;
      row()!.click();
      expect(open).toHaveBeenCalledWith(AmountSheet, expect.objectContaining({ data: expect.objectContaining({ max: 200_000 }) }));
      await until(
        async () => (await db.expenses.toArray()).length,
        () => true,
      );
      await settle(() => row()!.textContent!.replace(/[\u00a0\u202f]/g, ' ').includes('1 500,00 ₴'));
      const ret = (await db.expenses.toArray()).find((e) => e.kind === 'return')!;
      expect(ret).toMatchObject({ amountKopecks: 50_000, categoryId: vacation.id, date: '2026-11-24' });
    });

    it('has no Show frozen switch any more', async () => {
      const { el } = await setup();
      expect(el.querySelector('[data-testid="toggle-show-frozen"]')).toBeNull();
    });
  });

  describe('daily share', () => {
    it('reads "Not set" until set, then saves 40 % from the percent sheet', async () => {
      const { text, settle, tap, waitStored } = await setup();
      await settle(() => text('row-share') === 'Not set');
      sheetResult = 40;
      tap('row-share');
      expect(open).toHaveBeenCalledWith(PercentSheet, expect.objectContaining({ data: { title: 'Daily share of income', percent: null } }));
      await waitStored((s) => s.dailySharePercent === 40);
      await settle(() => text('row-share') === '40 %');
    });

    it('cancel saves nothing', async () => {
      const { tap, stored } = await setup((r) => r.setDailyShare(25));
      sheetResult = undefined;
      tap('row-share');
      await new Promise((r) => setTimeout(r, 30));
      expect((await stored()).dailySharePercent).toBe(25);
    });
  });
});