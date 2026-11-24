import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { catchError, concatMap, EMPTY, firstValueFrom, switchMap } from 'rxjs';
import { BudgetService } from '../../core/budget/budget.service';
import { ExpenseRepository, sumKopecks } from '../../core/db/expense.repository';
import { Expense } from '../../core/db/models';
import { SettingsRepository } from '../../core/db/settings.repository';
import { formatDayLabel } from '../../core/date/format';
import { DateKey } from '../../core/date/kyiv-date';
import { TodayService } from '../../core/date/today.service';
import { formatUah } from '../../core/money/money';
import { Toast } from '../../core/ui/toast';
import type { EditExpenseSheet, EditResult } from '../expense-entry/edit-expense.sheet';
import { TodayList } from '../expense-entry/today-list';
import { ChosenDay } from './chosen-day';
import { WeekStrip } from './week-strip/week-strip';

export const UNDO_DURATION_MS = 6000;

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodayList, WeekStrip],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly expenses = inject(ExpenseRepository);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  private readonly today = inject(TodayService).today;
  private readonly picked = inject(ChosenDay).picked;
  protected readonly day = computed(() => this.picked() ?? this.today());
  protected readonly isToday = computed(() => this.day() === this.today());
  protected readonly listHeading = computed(() => (this.isToday() ? 'Today' : formatDayLabel(this.day())));
  protected readonly emptyText = computed(() => (this.isToday() ? 'Nothing spent today yet.' : 'Nothing recorded this day.'));

  private readonly dayExpenses = toSignal(
    toObservable(this.day).pipe(switchMap((day) => this.expenses.forDate$(day))),
    { initialValue: [] as Expense[] },
  );
  private readonly budgetService = inject(BudgetService);
  private readonly settings = inject(SettingsRepository).settings;
  private readonly frozenIds = this.budgetService.frozenIds;
  private readonly showFrozen = computed(() => this.settings()?.showFrozen ?? true);

  protected readonly listed = computed(() =>
    this.showFrozen() ? this.dayExpenses() : this.dayExpenses().filter((e) => !this.frozenIds().has(e.categoryId)),
  );
  protected readonly dayTotal = computed(() =>
    sumKopecks(this.dayExpenses().filter((e) => !this.frozenIds().has(e.categoryId))),
  );
  protected readonly money = formatUah;
  protected readonly budget = this.budgetService.budget;
  protected readonly shownBalance = computed(() => {
    const b = this.budget();
    if (!b) return 0;
    return this.showFrozen() ? b.balance - b.frozen : b.balance;
  });

  protected pickDay(day: DateKey): void {
    this.picked.set(day === this.today() ? null : day);
  }

  protected add(): void {
    const day = this.picked();
    void this.router.navigateByUrl(day ? `/add?date=${day}` : '/add');
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
    // onAction() completes when the snackbar closes, so this needs no manual unsubscribe.
    this.toast
      .show(`Deleted ${formatUah(expense.amountKopecks)}`, 'Undo', UNDO_DURATION_MS)
      .onAction()
      .pipe(
        concatMap(() => this.expenses.restore(expense.id)),
        catchError((err) => {
          console.error('Could not restore expense', err);
          this.toast.show("Couldn't undo.", 'OK', 4000);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  async onEdit(expense: Expense): Promise<void> {
    const { EditExpenseSheet } = await import('../expense-entry/edit-expense.sheet');
    const ref = this.bottomSheet.open<EditExpenseSheet, Expense, EditResult>(EditExpenseSheet, {
      data: expense,
      ariaLabel: 'Edit expense',
    });
    const result = await firstValueFrom(ref.afterDismissed());
    if (result === 'saved') this.toast.show('Expense updated');
    if (result === 'error') this.toast.show("Couldn't save changes. Try again.", 'OK', 5000);
  }
}
