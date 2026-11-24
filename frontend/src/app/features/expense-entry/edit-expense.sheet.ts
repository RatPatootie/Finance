import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CategoryRepository } from '../../core/db/category.repository';
import { ExpenseRepository } from '../../core/db/expense.repository';
import { Expense } from '../../core/db/models';
import { TodayService } from '../../core/date/today.service';
import { applyKey, KeypadKey } from '../../core/money/keypad';
import { toAmountString, toKopecks } from '../../core/money/money';
import { AmountDisplay } from './amount-display';
import { CategoryGrid } from './category-grid';
import { DateChip } from './date-chip';
import { Keypad } from './keypad';

export type EditResult = 'saved' | 'error' | undefined;

@Component({
  selector: 'app-edit-expense-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountDisplay, CategoryGrid, DateChip, Keypad],
  templateUrl: './edit-expense.sheet.html',
  styleUrl: './edit-expense.sheet.scss',
})
export class EditExpenseSheet {
  private readonly ref = inject<MatBottomSheetRef<EditExpenseSheet, EditResult>>(MatBottomSheetRef);
  private readonly expense = inject<Expense>(MAT_BOTTOM_SHEET_DATA);
  private readonly repo = inject(ExpenseRepository);
  private readonly categoryRepo = inject(CategoryRepository);

  protected readonly today = inject(TodayService).today;
  protected readonly amount = signal(toAmountString(this.expense.amountKopecks));
  protected readonly categoryId = signal(this.expense.categoryId);
  protected readonly date = signal(this.expense.date);
  private readonly saving = signal(false);

  /** Active categories, plus the expense's own one if it has since been hidden. */
  protected readonly categories = computed(() => {
    const active = this.categoryRepo.active();
    if (active.some((c) => c.id === this.expense.categoryId)) return active;
    const own = this.categoryRepo.byId(this.expense.categoryId);
    return own ? [...active, own] : active;
  });

  protected readonly canSave = computed(() => toKopecks(this.amount()) > 0 && !this.saving());

  protected onKey(key: KeypadKey): void {
    this.amount.update((s) => applyKey(s, key));
  }

  protected cancel(): void {
    this.ref.dismiss(undefined);
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    try {
      await this.repo.update(this.expense.id, {
        amountKopecks: toKopecks(this.amount()),
        categoryId: this.categoryId(),
        date: this.date(),
      });
      this.ref.dismiss('saved');
    } catch (err) {
      console.error('Could not update expense', err);
      this.ref.dismiss('error');
    }
  }
}
