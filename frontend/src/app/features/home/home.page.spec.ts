import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { CategoryRepository } from '../../core/db/category.repository';
import { ExpenseRepository } from '../../core/db/expense.repository';
import { FinanceDb } from '../../core/db/finance-db';
import { provideTestDb, until } from '../../core/db/testing';
import { CLOCK } from '../../core/date/clock';
import { TodayService } from '../../core/date/today.service';
import { SettingsRepository } from '../../core/db/settings.repository';
import { Toast } from '../../core/ui/toast';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let now: Date;
  let db: FinanceDb;
  let toast: { show: ReturnType<typeof vi.fn>; action: Subject<void> };

  async function setup() {
    now = new Date('2026-11-23T10:00:00Z'); // 12:00 Kyiv
    const test = provideTestDb();
    db = test.db;
    const action = new Subject<void>();
    toast = { action, show: vi.fn(() => ({ onAction: () => action.asObservable() })) };
    TestBed.configureTestingModule({
      providers: [...test.providers, provideRouter([]), { provide: CLOCK, useValue: () => now }, { provide: Toast, useValue: toast }],
    });
    const categories = TestBed.inject(CategoryRepository);
    await categories.seedDefaultsIfEmpty();
    const cats = await db.categories.orderBy('sortOrder').toArray();
    const id = (name: string) => cats.find((c) => c.name === name)!.id;
    const repo = TestBed.inject(ExpenseRepository);
    const add = async (amountKopecks: number, category: string, date = '2026-11-23') =>
      repo.add({ amountKopecks, categoryId: id(category), date });

    const fixture = TestBed.createComponent(HomePage);
    const el = fixture.nativeElement as HTMLElement;
    const rows = () => [...el.querySelectorAll('[data-testid="expense-row"]')].map((r) => r.textContent!.replace(/\s+/g, ' ').trim());
    const hero = () => el.querySelector('[data-testid="today-total"]')!.textContent!.replace(/[  ]/g, ' ').trim();
    const settle = (predicate: () => boolean) =>
      until(
        () => {
          fixture.detectChanges();
          return predicate();
        },
        (ok) => ok,
      );
    return { fixture, el, add, rows, hero, settle };
  }

  it('shows an empty state and 0 as the main figure', async () => {
    const { el, hero, settle } = await setup();
    await settle(() => !!el.querySelector('[data-testid="today-empty"]'));
    expect(hero()).toBe('0,00 ₴');
  });

  it('lists today newest first with the total as the main figure', async () => {
    const { add, rows, hero, settle } = await setup();
    await add(8500, 'Food');
    now = new Date('2026-11-23T10:05:00Z');
    await add(4000, 'Transport');
    await add(6000, 'Fun', '2026-11-22'); // another day: not shown
    await settle(() => rows().length === 2);
    expect(rows()[0]).toMatch(/^Transport\s*12:05\s*40,00/);
    expect(rows()[1]).toMatch(/^Food\s*12:00\s*85,00/);
    expect(hero()).toBe('125,00 ₴');
  });

  it('lists only the 3 newest, with the total of all and a Show all / Show less toggle', async () => {
    const { el, add, rows, hero, settle } = await setup();
    for (let i = 1; i <= 5; i++) {
      now = new Date(`2026-11-23T10:0${i}:00Z`);
      await add(i * 1000, 'Food');
    }
    const toggle = () => el.querySelector<HTMLButtonElement>('[data-testid="toggle-all"]');
    await settle(() => rows().length === 3 && !!toggle());
    expect(rows().map((r) => r.match(/12:0(\d)/)![1])).toEqual(['5', '4', '3']);
    expect(hero()).toBe('150,00 ₴');
    expect(toggle()!.textContent!.trim()).toBe('Show all 5');
    toggle()!.click();
    await settle(() => rows().length === 5);
    expect(toggle()!.textContent!.trim()).toBe('Show less');
    toggle()!.click();
    await settle(() => rows().length === 3);
  });

  it('shows no toggle with 3 or fewer', async () => {
    const { el, add, rows, settle } = await setup();
    for (let i = 1; i <= 3; i++) await add(i * 1000, 'Food');
    await settle(() => rows().length === 3);
    expect(el.querySelector('[data-testid="toggle-all"]')).toBeNull();
  });

  it('the add button opens the entry screen', async () => {
    const { el, fixture } = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('[data-testid="add-expense"]')!.click();
    expect(navigate).toHaveBeenCalledWith('/add');
  });

  it('delete then undo restores the expense', async () => {
    const { el, add, rows, hero, settle } = await setup();
    await add(4000, 'Transport');
    await settle(() => rows().length === 1);
    el.querySelector<HTMLButtonElement>('[data-testid="expense-row"] .del')!.click();
    await settle(() => rows().length === 0);
    expect(hero()).toBe('0,00 ₴');
    expect(toast.show).toHaveBeenLastCalledWith(expect.stringContaining('Deleted'), 'Undo', 6000);
    toast.action.next();
    await settle(() => rows().length === 1);
    expect(hero()).toBe('40,00 ₴');
  });

  it('delete without undo keeps the record marked deleted', async () => {
    const { el, add, rows, settle } = await setup();
    await add(4000, 'Transport');
    await settle(() => rows().length === 1);
    el.querySelector<HTMLButtonElement>('[data-testid="expense-row"] .del')!.click();
    await settle(() => rows().length === 0);
    const stored = await db.expenses.toArray();
    expect(stored).toHaveLength(1);
    expect(stored[0].isDeleted).toBe(1);
  });

  describe('budget hero', () => {
    const norm = (s: string | null | undefined) => (s ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').replace(/\s?·/g, ' ·').trim();
    const balance = (el: HTMLElement) => norm(el.querySelector('[data-testid="hero-balance"]')?.textContent);
    const left = (el: HTMLElement) => norm(el.querySelector('[data-testid="hero-left"]')?.textContent);
    const status = (el: HTMLElement) => el.querySelector('[data-testid="hero-left"]')?.getAttribute('data-status');

    it('asks to set the balance until one exists; the card opens Settings', async () => {
      const { el, settle } = await setup();
      await settle(() => !!el.querySelector('[data-testid="setup-balance"]'));
      expect(el.querySelector('[data-testid="hero-balance"]')).toBeNull();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      el.querySelector<HTMLButtonElement>('[data-testid="setup-balance"]')!.click();
      expect(navigate).toHaveBeenCalledWith('/settings');
    });

    it('the gear opens Settings', async () => {
      const { el } = await setup();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      el.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')!.click();
      expect(navigate).toHaveBeenCalledWith('/settings');
    });

    it('shows the balance and left for today in green, and updates after a save', async () => {
      const { el, add, settle } = await setup();
      now = new Date('2026-11-24T07:00:00Z'); // 09:00 Kyiv, 7 days left
      TestBed.inject(TodayService).refresh();
      await TestBed.inject(SettingsRepository).setBalance(1_200_000);
      await settle(() => balance(el) === '12 000,00 ₴');
      expect(left(el)).toBe('Left today 1 714,28 ₴ · of 1 714,28 ₴');

      now = new Date('2026-11-24T11:00:00Z');
      await add(30_000, 'Food', '2026-11-24');
      await settle(() => balance(el) === '11 700,00 ₴');
      expect(left(el)).toBe('Left today 1 414,28 ₴ · of 1 714,28 ₴');
      expect(status(el)).toBe('green');
    });

    it('shows "over by" in red', async () => {
      const { el, add, settle } = await setup();
      now = new Date('2026-11-30T07:00:00Z'); // last day: limit = all free money
      TestBed.inject(TodayService).refresh();
      await TestBed.inject(SettingsRepository).setBalance(50_000);
      now = new Date('2026-11-30T08:00:00Z');
      await add(62_000, 'Food', '2026-11-30');
      await settle(() => left(el).startsWith('Over by'));
      expect(left(el)).toBe('Over by 120,00 ₴ · limit 500,00 ₴');
      expect(status(el)).toBe('red');
      expect(balance(el)).toBe('-120,00 ₴');
    });

    it('turns yellow from 80 % of the limit', async () => {
      const { el, add, settle } = await setup();
      now = new Date('2026-11-30T07:00:00Z');
      TestBed.inject(TodayService).refresh();
      await TestBed.inject(SettingsRepository).setBalance(100_000);
      now = new Date('2026-11-30T08:00:00Z');
      await add(80_000, 'Food', '2026-11-30');
      await settle(() => status(el) === 'yellow');
    });
  });

  it('switches to the new day after midnight', async () => {
    const { add, rows, settle } = await setup();
    await add(8500, 'Food');
    await settle(() => rows().length === 1);
    now = new Date('2026-11-23T22:00:01Z'); // 00:00:01 on 24 Nov in Kyiv
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(() => rows().length === 0);
  });
});
