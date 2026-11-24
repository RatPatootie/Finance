import { inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { CLOCK } from '../date/clock';
import { kyivDateKey } from '../date/kyiv-date';
import { FINANCE_DB } from './finance-db';
import { BudgetSettings, DEFAULT_SETTINGS, nextTimestamp } from './models';

/** Largest amount the keypad can produce (9 999 999.99 ₴). */
export const MAX_SETTING_KOPECKS = 999_999_999;

@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  private readonly db = inject(FINANCE_DB);
  private readonly clock = inject(CLOCK);

  /**
   * Live budget settings. `undefined` only while the first read is running;
   * after that, defaults are returned when nothing has been saved yet.
   */
  readonly settings: Signal<BudgetSettings | undefined> = toSignal(
    from(liveQuery(async () => (await this.db.settings.get('budget')) ?? DEFAULT_SETTINGS)),
  );

  /** One read, for code that is not reactive. */
  async get(): Promise<BudgetSettings> {
    return (await this.db.settings.get('budget')) ?? DEFAULT_SETTINGS;
  }

  /** Saves the balance the user has right now; this moves the balance anchor. */
  setBalance(kopecks: number): Promise<void> {
    assertKopecks(kopecks);
    const now = this.clock();
    return this.patch({ balanceKopecks: kopecks, balanceSetAt: now.toISOString(), balanceDate: kyivDateKey(now) });
  }

  setMonthlyIncome(kopecks: number): Promise<void> {
    assertKopecks(kopecks);
    return this.patch({ monthlyIncomeKopecks: kopecks });
  }

  setPayday(day: number): Promise<void> {
    if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error('Payday must be a day from 1 to 31');
    return this.patch({ payday: day });
  }

  private async patch(changes: Partial<BudgetSettings>): Promise<void> {
    await this.db.transaction('rw', this.db.settings, async () => {
      const current = (await this.db.settings.get('budget')) ?? DEFAULT_SETTINGS;
      await this.db.settings.put({
        ...current,
        ...changes,
        id: 'budget',
        updatedAt: nextTimestamp(this.clock(), current.updatedAt),
      });
    });
  }
}

function assertKopecks(kopecks: number): void {
  if (!Number.isInteger(kopecks) || kopecks < 0 || kopecks > MAX_SETTING_KOPECKS) {
    throw new Error('Amount must be a whole number of kopecks, zero or more');
  }
}
