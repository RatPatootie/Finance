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
import { ChosenDay } from './chosen-day';
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
    await settle(() => rows().length === 3 && toggle()?.textContent?.trim() === 'Show all 5');
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

  it('shows the week strip; saving today recolours today', async () => {
    const { el, add, settle } = await setup();
    await TestBed.inject(SettingsRepository).setMonthlyIncome(3_000_000);
    await TestBed.inject(SettingsRepository).setDailyShare(40);
    const today = () => el.querySelector('app-week-strip [data-day="2026-11-23"]');
    await settle(() => today()?.getAttribute('data-state') === 'none');
    await add(5_000, 'Food');
    await settle(() => today()?.getAttribute('data-state') === 'ok');
  });

  it('a day picked in the week strip fills the main list, which can be edited, and the add button uses that day', async () => {
    const { el, add, rows, hero, settle } = await setup();
    await add(4_000, 'Transport', '2026-11-22');
    await add(1_500, 'Food', '2026-11-22');
    await add(8_500, 'Food');
    const heading = () => el.querySelector('app-today-list.today h2')!.textContent!.trim();
    await settle(() => rows().length === 1 && heading() === 'Today');

    el.querySelector<HTMLButtonElement>('app-week-strip [data-testid="prev-week"]')!.click();
    await settle(() => !!el.querySelector('app-week-strip [data-day="2026-11-22"]'));
    el.querySelector<HTMLButtonElement>('app-week-strip [data-day="2026-11-22"]')!.click();
    await settle(() => heading() === 'Sun 22 Nov' && rows().length === 2);
    expect(hero()).toBe('55,00 ₴');

    el.querySelector<HTMLButtonElement>('app-today-list.today [data-testid="expense-row"] .del')!.click();
    await settle(() => rows().length === 1);
    expect(['15,00 ₴', '40,00 ₴']).toContain(hero());

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    el.querySelector<HTMLButtonElement>('[data-testid="add-expense"]')!.click();
    expect(navigate).toHaveBeenCalledWith('/add?date=2026-11-22');

    el.querySelector<HTMLButtonElement>('app-week-strip [data-testid="next-week"]')!.click();
    await settle(() => !!el.querySelector('app-week-strip [data-day="2026-11-23"]'));
    el.querySelector<HTMLButtonElement>('app-week-strip [data-day="2026-11-23"]')!.click();
    await settle(() => heading() === 'Today' && rows().length === 1);
    el.querySelector<HTMLButtonElement>('[data-testid="add-expense"]')!.click();
    expect(navigate).toHaveBeenLastCalledWith('/add');
  });

  it('a chosen past day survives a trip to the entry screen, with the strip on its week', async () => {
    const { el, settle } = await setup();
    TestBed.inject(ChosenDay).picked.set('2026-11-22');
    await settle(
      () =>
        el.querySelector('app-today-list.today h2')?.textContent?.trim() === 'Sun 22 Nov' &&
        el.querySelector('app-week-strip [data-testid="week-label"]')?.textContent?.trim() === '16–22 Nov',
    );
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
    expect(['15,00 ₴', '40,00 ₴']).toContain(hero());
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
    const norm = (s: string | null | undefined) => (s ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
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

    const withShare = async () => {
      const settings = TestBed.inject(SettingsRepository);
      await settings.setMonthlyIncome(3_000_000);
      await settings.setDailyShare(40);
      return settings;
    };

    it('asks for the daily share until it is set; the prompt opens Settings', async () => {
      const { el, settle } = await setup();
      await TestBed.inject(SettingsRepository).setBalance(1_200_000);
      await settle(() => !!el.querySelector('[data-testid="setup-share"]'));
      expect(el.querySelector('[data-testid="hero-left"]')).toBeNull();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      el.querySelector<HTMLButtonElement>('[data-testid="setup-share"]')!.click();
      expect(navigate).toHaveBeenCalledWith('/settings');
    });

    it('top to bottom: balance, add button, week strip, day list', async () => {
      const { el, settle } = await setup();
      await TestBed.inject(SettingsRepository).setBalance(1_200_000);
      await settle(() => !!el.querySelector('[data-testid="hero-balance"]'));
      const order = [
        '[data-testid="hero-balance"]',
        '[data-testid="add-expense"]',
        'app-week-strip',
        'app-today-list.today',
      ].map((s) => el.querySelector(s)!);
      for (let i = 1; i < order.length; i++) {
        expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    });

    it('shows the balance and left for today in green, and updates after a save', async () => {
      const { el, add, settle } = await setup();
      now = new Date('2026-11-24T07:00:00Z');
      TestBed.inject(TodayService).refresh();
      const settings = await withShare();
      await settings.setBalance(1_200_000);
      await settle(() => balance(el) === '12 000,00 ₴' && left(el) === '400,00 ₴ left today');

      now = new Date('2026-11-24T11:00:00Z');
      await add(15_000, 'Food', '2026-11-24');
      await settle(() => balance(el) === '11 850,00 ₴');
      expect(left(el)).toBe('250,00 ₴ left today');
      expect(status(el)).toBe('green');
    });

    it('shows "over today" in red', async () => {
      const { el, add, settle } = await setup();
      now = new Date('2026-11-24T07:00:00Z');
      TestBed.inject(TodayService).refresh();
      const settings = await withShare();
      await settings.setBalance(50_000);
      now = new Date('2026-11-24T08:00:00Z');
      await add(52_000, 'Food', '2026-11-24');
      await settle(() => left(el).endsWith('over today'));
      expect(left(el)).toBe('120,00 ₴ over today');
      expect(status(el)).toBe('red');
      expect(balance(el)).toBe('-20,00 ₴');
    });

    it('frozen money is always listed and kept out of the shown balance, today and on a past day', async () => {
      const { el, rows, hero, settle } = await setup();
      now = new Date('2026-11-24T07:00:00Z');
      TestBed.inject(TodayService).refresh();
      const settings = await withShare();
      await settings.setBalance(1_200_000);
      const vacation = await TestBed.inject(CategoryRepository).add('Vacation', 'frozen');
      now = new Date('2026-11-24T08:00:00Z');
      await TestBed.inject(ExpenseRepository).add({ amountKopecks: 200_000, categoryId: vacation.id, date: '2026-11-24' });
      await TestBed.inject(ExpenseRepository).add({ amountKopecks: 30_000, categoryId: vacation.id, date: '2026-11-23' });
      await settle(() => balance(el) === '9 700,00 ₴' && rows().length === 1);
      expect(el.querySelector('[data-testid="expense-row"]')!.getAttribute('data-kind')).toBe('freeze');
      expect(rows()[0]).toContain('Frozen');
      expect(left(el)).toBe('400,00 ₴ left today');
      expect(hero()).toBe('0,00 ₴');

      el.querySelector<HTMLButtonElement>('app-week-strip [data-day="2026-11-23"]')!.click();
      await settle(() => rows().length === 1 && rows()[0].includes('300,00'));
      expect(rows()[0]).toContain('Frozen');
      el.querySelector<HTMLButtonElement>('app-week-strip [data-day="2026-11-24"]')!.click();
      await settle(() => rows().length === 1 && rows()[0].includes('2 000,00'));

      now = new Date('2026-11-24T09:00:00Z');
      const ret = await TestBed.inject(ExpenseRepository).add({
        amountKopecks: 50_000,
        categoryId: vacation.id,
        date: '2026-11-24',
        kind: 'return',
      });
      await settle(() => rows().length === 2);
      const returnRow = el.querySelector('[data-testid="expense-row"][data-kind="return"]')!;
      expect(returnRow.textContent!.replace(/[  ]/g, ' ')).toMatch(/Returned[\s\S]*−500,00 ₴/);
      await TestBed.inject(ExpenseRepository).softDelete(ret.id);
      await settle(() => rows().length === 1);
    });

    it('shows a bar of how much of today’s limit is used', async () => {
      const { el, add, settle } = await setup();
      now = new Date('2026-11-24T07:00:00Z');
      TestBed.inject(TodayService).refresh();
      const settings = await withShare();
      await settings.setBalance(1_200_000);
      const bar = () => el.querySelector('[role="progressbar"]');
      const usage = () => el.querySelector('[data-testid="usage"]');
      await settle(() => bar()?.getAttribute('aria-valuenow') === '0');

      now = new Date('2026-11-24T08:00:00Z');
      await add(15_000, 'Food', '2026-11-24');
      await settle(() => bar()?.getAttribute('aria-valuenow') === '37.5');
      expect(norm(bar()!.getAttribute('aria-label'))).toBe('150,00 ₴ of 400,00 ₴ used today');
      expect(el.querySelector('[data-testid="usage"]')!.textContent!.trim()).toBe('');
      expect(usage()!.classList.contains('status-green')).toBe(true);
      expect(el.querySelector<HTMLElement>('[data-testid="usage-fill"]')!.style.width).toBe('37.5%');

      await add(37_000, 'Food', '2026-11-24');
      await settle(() => bar()?.getAttribute('aria-valuenow') === '100');
      expect(usage()!.classList.contains('status-red')).toBe(true);
    });

    it('shows no bar without a daily share', async () => {
      const { el, settle } = await setup();
      await TestBed.inject(SettingsRepository).setBalance(1_200_000);
      await settle(() => !!el.querySelector('[data-testid="setup-share"]'));
      expect(el.querySelector('[data-testid="usage"]')).toBeNull();
    });

    it('turns yellow from 80 % of the limit', async () => {
      const { el, add, settle } = await setup();
      now = new Date('2026-11-24T07:00:00Z');
      TestBed.inject(TodayService).refresh();
      const settings = await withShare();
      await settings.setBalance(100_000);
      now = new Date('2026-11-24T08:00:00Z');
      await add(32_000, 'Food', '2026-11-24');
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
