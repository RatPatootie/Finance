import { computed, inject, Injectable, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { DateKey } from '../date/kyiv-date';
import { TodayService } from '../date/today.service';
import { CategoryRepository } from '../db/category.repository';
import { ExpenseRepository } from '../db/expense.repository';
import { categoryType, Expense } from '../db/models';
import { SettingsRepository } from '../db/settings.repository';
import { Budget, computeBudget, dayBudget, FrozenTotals, frozenTotals } from './budget';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly settingsRepo = inject(SettingsRepository);
  private readonly expenses = inject(ExpenseRepository);
  private readonly categories = inject(CategoryRepository);
  private readonly today = inject(TodayService).today;

  private readonly frozenKey = computed(() =>
    this.categories
      .all()
      .filter((c) => categoryType(c) === 'frozen')
      .map((c) => c.id)
      .sort()
      .join(','),
  );

  readonly frozenIds: Signal<ReadonlySet<string>> = computed(() => new Set(this.frozenKey().split(',').filter(Boolean)));

  private readonly frozenRecords: Signal<Expense[] | undefined> = toSignal(
    toObservable(this.frozenKey).pipe(switchMap((key) => (key ? this.expenses.inCategories$(key.split(',')) : of([])))),
  );

  readonly frozen: Signal<FrozenTotals | undefined> = computed(() => {
    const records = this.frozenRecords();
    return records ? frozenTotals(records, this.frozenIds(), this.today()) : undefined;
  });

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
    const frozen = this.frozen();
    if (!expenses || !frozen) return undefined;
    return computeBudget(settings, expenses, this.today(), { ids: this.frozenIds(), total: frozen.total });
  });

  forDay(day: DateKey): Budget | null | undefined {
    const settings = this.settingsRepo.settings();
    if (settings === undefined) return undefined;
    if (settings.balanceKopecks === null) return null;
    const expenses = this.sinceAnchor();
    const frozen = this.frozenRecords();
    if (!expenses || !frozen) return undefined;
    return dayBudget(settings, expenses, day, this.frozenIds(), frozen);
  }
}