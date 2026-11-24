import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BudgetService } from '../../core/budget/budget.service';
import { CategoryRepository } from '../../core/db/category.repository';
import { ExpenseRepository } from '../../core/db/expense.repository';
import { TodayService } from '../../core/date/today.service';
import { Category, categoryType } from '../../core/db/models';
import { SettingsRepository } from '../../core/db/settings.repository';
import { formatUah } from '../../core/money/money';
import { Toast } from '../../core/ui/toast';
import { AmountSheet, AmountSheetData } from './amount.sheet';
import { CategorySheet, CategorySheetData, CategorySheetResult } from './categories/category.sheet';
import { RemoveCategoryData, RemoveCategoryResult, RemoveCategorySheet } from './categories/remove-category.sheet';
import { PaydaySheet } from './payday.sheet';

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  private readonly repo = inject(SettingsRepository);
  private readonly budgetService = inject(BudgetService);
  private readonly budget = this.budgetService.budget;
  private readonly frozenTotals = this.budgetService.frozen;
  private readonly expenses = inject(ExpenseRepository);
  private readonly today = inject(TodayService).today;
  private readonly sheet = inject(MatBottomSheet);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly categoryRepo = inject(CategoryRepository);

  protected readonly settings = this.repo.settings;
  protected readonly categories = this.categoryRepo.listed;
  protected readonly showFrozen = computed(() => this.settings()?.showFrozen ?? true);
  protected readonly frozenRows = computed(() => {
    const totals = this.frozenTotals()?.byCategory;
    return this.categories()
      .filter((c) => categoryType(c) === 'frozen')
      .map((category) => ({ category, total: totals?.get(category.id) ?? 0 }));
  });
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

  protected toggleShowFrozen(): void {
    void this.save(() => this.repo.setShowFrozen(!this.showFrozen()), this.showFrozen() ? 'Frozen hidden' : 'Frozen shown');
  }

  protected async returnFrozen(category: Category, total: number): Promise<void> {
    const value = await this.askAmount({
      title: `Return from ${category.name}`,
      kopecks: null,
      max: total,
      maxMessage: `More than is frozen (${formatUah(total)})`,
    });
    if (value === undefined || value <= 0) return;
    await this.save(
      () => this.expenses.add({ amountKopecks: value, categoryId: category.id, date: this.today(), kind: 'return' }).then(() => undefined),
      `Returned ${formatUah(value)}`,
    );
  }

  protected isFrozen(c: Category): boolean {
    return categoryType(c) === 'frozen';
  }

  protected async addCategory(): Promise<void> {
    const result = await this.openCategorySheet({});
    if (result === 'added') this.toast.show('Category added');
  }

  protected async editCategory(category: Category): Promise<void> {
    const result = await this.openCategorySheet({ category });
    if (result === 'renamed') this.toast.show('Category renamed');
    if (result === 'remove') await this.removeCategory(category);
  }

  private async removeCategory(category: Category): Promise<void> {
    const count = await this.categoryRepo.countExpenses(category.id);
    const ref = this.sheet.open<RemoveCategorySheet, RemoveCategoryData, RemoveCategoryResult>(RemoveCategorySheet, {
      data: { category, count },
      ariaLabel: `Remove ${category.name}`,
    });
    if ((await firstValueFrom(ref.afterDismissed())) === 'removed') this.toast.show(`Removed ${category.name}`);
  }

  private openCategorySheet(data: CategorySheetData): Promise<CategorySheetResult> {
    const ref = this.sheet.open<CategorySheet, CategorySheetData, CategorySheetResult>(CategorySheet, {
      data,
      ariaLabel: data.category ? 'Edit category' : 'New category',
    });
    return firstValueFrom(ref.afterDismissed());
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
