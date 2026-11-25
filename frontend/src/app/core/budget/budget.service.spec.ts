import { TestBed } from '@angular/core/testing';
import { CLOCK } from '../date/clock';
import { CategoryRepository } from '../db/category.repository';
import { ExpenseRepository } from '../db/expense.repository';
import { SettingsRepository } from '../db/settings.repository';
import { provideTestDb, until } from '../db/testing';
import { TodayService } from '../date/today.service';
import { Budget } from './budget';
import { BudgetService } from './budget.service';

describe('BudgetService', () => {
  let now: Date;

  async function setup() {
    now = new Date('2026-11-24T07:00:00Z'); // 09:00 Kyiv
    const test = provideTestDb();
    TestBed.configureTestingModule({ providers: [...test.providers, { provide: CLOCK, useValue: () => now }] });
    await TestBed.inject(CategoryRepository).seedDefaultsIfEmpty();
    const settings = TestBed.inject(SettingsRepository);
    const expenses = TestBed.inject(ExpenseRepository);
    const service = TestBed.inject(BudgetService);
    const budget = () => {
      TestBed.tick();
      return service.budget();
    };
    const waitBudget = (predicate: (b: Budget) => boolean) =>
      until(budget, (b) => !!b && predicate(b)) as Promise<Budget>;
    return { settings, expenses, service, budget, waitBudget };
  }

  it('is null when no balance is set', async () => {
    const { budget } = await setup();
    await until(budget, (b) => b === null);
  });


  it('follows add, edit, delete and restore', async () => {
    const { settings, expenses, waitBudget } = await setup();
    await settings.setMonthlyIncome(3_000_000);
    await settings.setDailyShare(40);
    await settings.setBalance(1_200_000);
    await waitBudget((b) => b.balance === 1_200_000 && b.limit === 40_000);

    now = new Date('2026-11-24T11:00:00Z');
    const e = await expenses.add({ amountKopecks: 30_000, categoryId: 'c', date: '2026-11-24' });
    await waitBudget((b) => b.balance === 1_170_000 && b.left === 10_000 && b.limit === 40_000);

    await expenses.update(e.id, { amountKopecks: 20_000 });
    await waitBudget((b) => b.balance === 1_180_000 && b.left === 20_000);

    await expenses.softDelete(e.id);
    await waitBudget((b) => b.balance === 1_200_000 && b.left === 40_000);

    await expenses.restore(e.id);
    await waitBudget((b) => b.balance === 1_180_000);
  });

  it('re-saving the balance moves the anchor, but today’s spending still counts', async () => {
    const { settings, expenses, waitBudget } = await setup();
    await settings.setBalance(1_000_000);
    now = new Date('2026-11-24T08:00:00Z');
    await expenses.add({ amountKopecks: 50_000, categoryId: 'c', date: '2026-11-24' });
    await waitBudget((b) => b.balance === 950_000);
    now = new Date('2026-11-24T09:00:00Z');
    await settings.setBalance(932_000);
    await waitBudget((b) => b.balance === 932_000 && b.spentToday === 50_000);
  });

  it('a daily share change updates the limit live; no share means no limit', async () => {
    const { settings, waitBudget } = await setup();
    await settings.setMonthlyIncome(3_000_000);
    await settings.setBalance(1_000_000);
    await waitBudget((b) => b.limit === null && b.status === null);
    await settings.setDailyShare(40);
    await waitBudget((b) => b.limit === 40_000 && b.status === 'green');
    await settings.setDailyShare(10);
    await waitBudget((b) => b.limit === 10_000);
  });

  it('switches day at Kyiv midnight and adds income on payday', async () => {
    const { settings, waitBudget } = await setup();
    await settings.setMonthlyIncome(3_000_000);
    await settings.setDailyShare(40);
    await settings.setPayday(25);
    await settings.setBalance(1_000_000);
    await waitBudget((b) => b.balance === 1_000_000);

    now = new Date('2026-11-24T22:00:01Z'); // 00:00:01 on 25 Nov in Kyiv
    TestBed.inject(TodayService).refresh();
    const b = await waitBudget((x) => x.balance === 4_000_000);
    expect(b.limit).toBe(40_000);
  });

  it('a freeze, a return and deleting a freeze update the frozen total; the limit stays', async () => {
    const { settings, expenses, waitBudget } = await setup();
    const vacation = await TestBed.inject(CategoryRepository).add('Vacation', 'frozen');
    await settings.setMonthlyIncome(3_000_000);
    await settings.setDailyShare(40);
    await settings.setBalance(1_200_000);
    await waitBudget((b) => b.limit === 40_000);

    now = new Date('2026-11-24T10:00:00Z');
    const freeze = await expenses.add({ amountKopecks: 200_000, categoryId: vacation.id, date: '2026-11-24' });
    await waitBudget((b) => b.frozen === 200_000 && b.limit === 40_000 && b.balance === 1_200_000 && b.spentToday === 0);

    await expenses.add({ amountKopecks: 50_000, categoryId: vacation.id, date: '2026-11-24', kind: 'return' });
    await waitBudget((b) => b.frozen === 150_000);

    await expenses.softDelete(freeze.id);
    await waitBudget((b) => b.frozen === 0 && b.limit === 40_000);
  });
});