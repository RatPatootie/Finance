import { TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { CLOCK } from '../../core/date/clock';
import { FinanceDb } from '../../core/db/finance-db';
import { SettingsRepository } from '../../core/db/settings.repository';
import { provideTestDb, until } from '../../core/db/testing';
import { Toast } from '../../core/ui/toast';
import { AmountSheet } from './amount.sheet';
import { PaydaySheet } from './payday.sheet';
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
    return { text, settle, tap, stored, waitStored };
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
});
