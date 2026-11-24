import { computed, inject, Injectable, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { TodayService } from '../date/today.service';
import { ExpenseRepository } from '../db/expense.repository';
import { Expense } from '../db/models';
import { SettingsRepository } from '../db/settings.repository';
import { Budget, computeBudget } from './budget';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly settingsRepo = inject(SettingsRepository);
  private readonly expenses = inject(ExpenseRepository);
  private readonly today = inject(TodayService).today;

  private readonly sinceAnchor: Signal<Expense[] | null | undefined> = toSignal(
    toObservable(this.settingsRepo.settings).pipe(
      map((s) => (s === undefined ? undefined : s.balanceDate)),
      distinctUntilChanged(),
      switchMap((date) => (date === undefined ? of(undefined) : date === null ? of(null) : this.expenses.since$(date))),
    ),
  );

  // undefined while loading, so no wrong figure flashes; null when no balance is set yet.
  readonly budget: Signal<Budget | null | undefined> = computed(() => {
    const settings = this.settingsRepo.settings();
    if (settings === undefined) return undefined;
    if (settings.balanceKopecks === null) return null;
    const expenses = this.sinceAnchor();
    if (!expenses) return undefined;
    return computeBudget(settings, expenses, this.today());
  });
}
