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
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
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
