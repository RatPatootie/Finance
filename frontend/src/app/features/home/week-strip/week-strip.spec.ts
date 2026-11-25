import { TestBed } from '@angular/core/testing';
import { CLOCK } from '../../../core/date/clock';
import { TodayService } from '../../../core/date/today.service';
import { CategoryRepository } from '../../../core/db/category.repository';
import { ExpenseRepository } from '../../../core/db/expense.repository';
import { Expense } from '../../../core/db/models';
import { SettingsRepository } from '../../../core/db/settings.repository';
import { provideTestDb, until } from '../../../core/db/testing';
import { WeekStrip } from './week-strip';

describe('WeekStrip', () => {
  let now: Date;

  async function setup() {
    now = new Date('2026-11-23T05:00:00Z');
    const test = provideTestDb();
    TestBed.configureTestingModule({ providers: [...test.providers, { provide: CLOCK, useValue: () => now }] });
    const categories = TestBed.inject(CategoryRepository);
    await categories.seedDefaultsIfEmpty();
    const food = (await test.db.categories.toArray()).find((c) => c.name === 'Food')!.id;
    const repo = TestBed.inject(ExpenseRepository);
    const add = (amountKopecks: number, date: string) => repo.add({ amountKopecks, categoryId: food, date });
    const settings = TestBed.inject(SettingsRepository);

    const fixture = TestBed.createComponent(WeekStrip);
    fixture.componentRef.setInput('selected', '2026-11-23');
    const el = fixture.nativeElement as HTMLElement;
    const settle = (predicate: () => boolean) =>
      until(
        () => {
          fixture.detectChanges();
          return predicate();
        },
        (ok) => ok,
      );
    const label = () => el.querySelector('[data-testid="week-label"]')!.textContent!.trim();
    const day = (key: string) => el.querySelector<HTMLButtonElement>(`[data-day="${key}"]`)!;
    const state = (key: string) => day(key)?.getAttribute('data-state');
    const tap = (id: string) => el.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!.click();
    return { fixture, el, settle, label, day, state, tap, add, settings, repo, food };
  }

  it('opens on the current week with today ringed and next disabled', async () => {
    const { el, settle, label, day } = await setup();
    now = new Date('2026-11-24T10:00:00Z');
    await settle(() => !!day('2026-11-23'));
    expect(label()).toBe('23–29 Nov');
    const nums = [...el.querySelectorAll('[data-testid="week-day"] .num')].map((n) => n.textContent!.trim());
    expect(nums).toEqual(['23', '24', '25', '26', '27', '28', '29']);
    expect(el.querySelector<HTMLButtonElement>('[data-testid="next-week"]')!.disabled).toBe(true);
  });

  it('goes back and forward, and labels a week across months', async () => {
    const { el, settle, label, tap } = await setup();
    await settle(() => label() === '23–29 Nov');
    tap('prev-week');
    await settle(() => label() === '16–22 Nov');
    expect(el.querySelector<HTMLButtonElement>('[data-testid="next-week"]')!.disabled).toBe(false);
    tap('next-week');
    await settle(() => label() === '23–29 Nov');
    for (let i = 0; i < 4; i++) tap('prev-week');
    await settle(() => label() === '26 Oct – 1 Nov');
  });

  it('colours days within and over the income-based limit, plain without records', async () => {
    const { settle, state, add, settings } = await setup();
    await settings.setMonthlyIncome(3_000_000);
    await settings.setDailyShare(40);
    now = new Date('2026-11-23T08:00:00Z');
    await add(20_000, '2026-11-23');
    now = new Date('2026-11-24T08:00:00Z');
    TestBed.inject(TodayService).refresh();
    await add(42_000, '2026-11-24');
    await settle(() => state('2026-11-23') === 'ok' && state('2026-11-24') === 'over');
    expect(state('2026-11-25')).toBe('none');
  });

  it('neutral without a daily share; days before the balance get a colour once it is set', async () => {
    const { settle, state, add, settings, tap, label } = await setup();
    now = new Date('2026-11-24T05:00:00Z');
    await settings.setBalance(400_000);
    await add(10_000, '2026-11-20');
    tap('prev-week');
    await settle(() => label() === '16–22 Nov' && state('2026-11-20') === 'unknown');
    await settings.setMonthlyIncome(3_000_000);
    await settings.setDailyShare(40);
    await settle(() => state('2026-11-20') === 'ok');
  });

  it('future days are dimmed and a tap on them selects nothing', async () => {
    const { fixture, settle, day } = await setup();
    now = new Date('2026-11-24T10:00:00Z');
    TestBed.inject(TodayService).refresh();
    const picked: string[] = [];
    fixture.componentInstance.selectedChange.subscribe((d) => picked.push(d));
    await settle(() => day('2026-11-26')?.getAttribute('aria-disabled') === 'true');
    day('2026-11-26').click();
    expect(picked).toEqual([]);
  });

  it('a tap on a past day or today selects it; the selected day is marked', async () => {
    const { fixture, settle, day, tap, label } = await setup();
    now = new Date('2026-11-24T10:00:00Z');
    TestBed.inject(TodayService).refresh();
    const picked: string[] = [];
    fixture.componentInstance.selectedChange.subscribe((d) => picked.push(d));
    await settle(() => day('2026-11-23')?.getAttribute('aria-pressed') === 'true');
    day('2026-11-24').click();
    tap('prev-week');
    await settle(() => label() === '16–22 Nov');
    day('2026-11-18').click();
    expect(picked).toEqual(['2026-11-24', '2026-11-18']);
    fixture.componentRef.setInput('selected', '2026-11-18');
    await settle(() => day('2026-11-18').classList.contains('selected'));
  });
});