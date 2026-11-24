import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BudgetService } from '../../core/budget/budget.service';
import { SettingsRepository } from '../../core/db/settings.repository';
import { formatUah } from '../../core/money/money';
import { Toast } from '../../core/ui/toast';
import { AmountSheet, AmountSheetData } from './amount.sheet';
import { PaydaySheet } from './payday.sheet';

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <button type="button" class="icon" data-testid="back" aria-label="Back" (click)="back()">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
        </svg>
      </button>
      <h1>Settings</h1>
    </header>

    <main class="page">
      <h2 class="section">Budget</h2>
      <ul class="list">
        <li>
          <button type="button" class="row" data-testid="row-balance" (click)="editBalance()">
            <span class="name">Balance</span>
            <span class="value" [class.unset]="balance() === null">{{ balanceText() }}</span>
          </button>
        </li>
        <li>
          <button type="button" class="row" data-testid="row-income" (click)="editIncome()">
            <span class="name">Monthly income</span>
            <span class="value">{{ money(settings()?.monthlyIncomeKopecks ?? 0) }}</span>
          </button>
        </li>
        <li>
          <button type="button" class="row" data-testid="row-payday" (click)="editPayday()">
            <span class="name">Payday</span>
            <span class="value">Day {{ settings()?.payday ?? 1 }}</span>
          </button>
        </li>
      </ul>
      <p class="note">
        Enter the money you have now. New expenses are taken off it and your income is added on payday. If it drifts from
        your bank, enter the right amount again.
      </p>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 4px;
      max-width: 480px;
      margin: 0 auto;
      padding: calc(8px + env(safe-area-inset-top)) 8px 8px;
    }
    h1 {
      margin: 0;
      font: var(--mat-sys-title-large);
    }
    .icon {
      width: 48px;
      height: 48px;
      border: 0;
      border-radius: 24px;
      display: grid;
      place-items: center;
      background: transparent;
      color: var(--mat-sys-on-surface);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .icon:active {
      background: var(--mat-sys-surface-container-highest);
    }
    .page {
      max-width: 480px;
      margin: 0 auto;
      padding: 8px 16px calc(24px + env(safe-area-inset-bottom));
    }
    .section {
      margin: 16px 0 8px;
      font: var(--mat-sys-title-small);
      color: var(--mat-sys-primary);
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      border-radius: 16px;
      overflow: hidden;
      background: var(--mat-sys-surface-container);
    }
    .list li + li {
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .row {
      width: 100%;
      min-height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 16px;
      border: 0;
      background: transparent;
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-body-large);
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .row:active {
      background: var(--mat-sys-surface-container-highest);
    }
    .value {
      color: var(--mat-sys-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }
    .value.unset {
      color: var(--mat-sys-primary);
    }
    .note {
      margin: 12px 4px 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class SettingsPage {
  private readonly repo = inject(SettingsRepository);
  private readonly budget = inject(BudgetService).budget;
  private readonly sheet = inject(MatBottomSheet);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  protected readonly settings = this.repo.settings;
  protected readonly money = formatUah;

  /** The current (derived) balance, which is what the user compares with the bank. */
  protected readonly balance = computed(() => this.budget()?.balance ?? null);
  protected readonly balanceText = computed(() => {
    const b = this.balance();
    return b === null ? 'Not set' : formatUah(b);
  });

  protected back(): void {
    void this.router.navigateByUrl('/');
  }

  protected async editBalance(): Promise<void> {
    const value = await this.askAmount({ title: 'Balance now', kopecks: this.balance() });
    if (value !== undefined) await this.save(() => this.repo.setBalance(value), 'Balance saved');
  }

  protected async editIncome(): Promise<void> {
    const current = this.settings()?.monthlyIncomeKopecks ?? 0;
    const value = await this.askAmount({ title: 'Monthly income', kopecks: current });
    if (value !== undefined) await this.save(() => this.repo.setMonthlyIncome(value), 'Income saved');
  }

  protected async editPayday(): Promise<void> {
    const ref = this.sheet.open<PaydaySheet, number, number>(PaydaySheet, {
      data: this.settings()?.payday ?? 1,
      ariaLabel: 'Choose payday',
    });
    const day = await firstValueFrom(ref.afterDismissed());
    if (day !== undefined) await this.save(() => this.repo.setPayday(day), `Payday: day ${day}`);
  }

  private askAmount(data: AmountSheetData): Promise<number | undefined> {
    const ref = this.sheet.open<AmountSheet, AmountSheetData, number>(AmountSheet, { data, ariaLabel: data.title });
    return firstValueFrom(ref.afterDismissed());
  }

  private async save(write: () => Promise<void>, message: string): Promise<void> {
    try {
      await write();
      this.toast.show(message);
    } catch (err) {
      console.error('Could not save settings', err);
      this.toast.show("Couldn't save. Try again.", 'OK', 4000);
    }
  }
}
