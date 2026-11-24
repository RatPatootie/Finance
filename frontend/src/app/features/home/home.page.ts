import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { BudgetService } from '../../core/budget/budget.service';
import { ExpenseRepository, sumKopecks } from '../../core/db/expense.repository';
import { Expense } from '../../core/db/models';
import { TodayService } from '../../core/date/today.service';
import { formatUah } from '../../core/money/money';
import { Toast } from '../../core/ui/toast';
import type { EditExpenseSheet, EditResult } from '../expense-entry/edit-expense.sheet';
import { TodayList } from '../expense-entry/today-list';

export const UNDO_DURATION_MS = 6000;

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodayList],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly expenses = inject(ExpenseRepository);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  protected readonly todayExpenses = toSignal(
    toObservable(inject(TodayService).today).pipe(switchMap((day) => this.expenses.forDate$(day))),
    { initialValue: [] as Expense[] },
  );
  protected readonly todayTotal = computed(() => sumKopecks(this.todayExpenses()));
  protected readonly money = formatUah;
  protected readonly budget = inject(BudgetService).budget;

  protected add(): void {
    void this.router.navigateByUrl('/add');
  }

  protected openSettings(): void {
    void this.router.navigateByUrl('/settings');
  }

  async onDelete(expense: Expense): Promise<void> {
    try {
      await this.expenses.softDelete(expense.id);
    } catch (err) {
      console.error('Could not delete expense', err);
      this.toast.show("Couldn't delete. Try again.", 'OK', 4000);
      return;
    }
    const ref = this.toast.show(`Deleted ${formatUah(expense.amountKopecks)}`, 'Undo', UNDO_DURATION_MS);
    ref.onAction().subscribe(() => {
      this.expenses.restore(expense.id).catch((err) => {
        console.error('Could not restore expense', err);
        this.toast.show("Couldn't undo.", 'OK', 4000);
      });
    });
  }

  async onEdit(expense: Expense): Promise<void> {
    // Loaded on demand: the editor isn't needed to see the day or add an expense.
    const { EditExpenseSheet } = await import('../expense-entry/edit-expense.sheet');
    const ref = this.bottomSheet.open<EditExpenseSheet, Expense, EditResult>(EditExpenseSheet, {
      data: expense,
      ariaLabel: 'Edit expense',
    });
    ref.afterDismissed().subscribe((result) => {
      if (result === 'saved') this.toast.show('Expense updated');
      if (result === 'error') this.toast.show("Couldn't save changes. Try again.", 'OK', 5000);
    });
  }
}
