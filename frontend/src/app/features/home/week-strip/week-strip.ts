import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { dayState, DayState } from '../../../core/budget/budget';
import { BudgetService } from '../../../core/budget/budget.service';
import { addDays, DateKey } from '../../../core/date/kyiv-date';
import { TodayService } from '../../../core/date/today.service';
import { formatLongDay, formatWeekLabel, startOfWeek, weekDays, weeksBetween } from '../../../core/date/week';
import { ExpenseRepository } from '../../../core/db/expense.repository';
import { Expense } from '../../../core/db/models';

interface DaySquare {
  key: DateKey;
  letter: string;
  dayOfMonth: number;
  state: DayState;
  isToday: boolean;
  isFuture: boolean;
  label: string;
}

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const STATE_TEXT: Record<DayState, string> = {
  none: 'no spending',
  ok: 'within the limit',
  over: 'over the limit',
  unknown: 'spending, no limit set',
};

@Component({
  selector: 'app-week-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './week-strip.html',
  styleUrl: './week-strip.scss',
})
export class WeekStrip {
  private readonly expenses = inject(ExpenseRepository);
  private readonly budget = inject(BudgetService);
  private readonly today = inject(TodayService).today;

  readonly selected = input.required<DateKey>();
  readonly selectedChange = output<DateKey>();

  private readonly currentMonday = computed(() => startOfWeek(this.today()));
  private readonly offset = linkedSignal(() => weeksBetween(this.currentMonday(), startOfWeek(this.selected())));
  protected readonly monday = computed(() => addDays(this.currentMonday(), this.offset() * 7));
  protected readonly label = computed(() => formatWeekLabel(this.monday()));
  protected readonly isCurrentWeek = computed(() => this.offset() >= 0);

  private readonly records = toSignal(
    toObservable(this.monday).pipe(switchMap((monday) => this.expenses.between$(monday, addDays(monday, 6)))),
    { initialValue: [] as Expense[] },
  );

  protected readonly days = computed<DaySquare[]>(() => {
    const today = this.today();
    const ids = this.budget.frozenIds();
    return weekDays(this.monday()).map((key, i) => {
      const isFuture = key > today;
      const dayRecords = this.records().filter((e) => e.date === key);
      const state = isFuture ? 'none' : dayState(dayRecords, this.budget.limitFor(key), ids);
      return {
        key,
        letter: LETTERS[i],
        dayOfMonth: Number(key.slice(8)),
        state,
        isToday: key === today,
        isFuture,
        label: `${formatLongDay(key)}, ${isFuture ? 'upcoming' : STATE_TEXT[state]}`,
      };
    });
  });

  protected previous(): void {
    this.offset.update((o) => o - 1);
  }

  protected next(): void {
    if (this.isCurrentWeek()) return;
    this.offset.update((o) => o + 1);
  }

  protected pick(day: DaySquare): void {
    if (!day.isFuture) this.selectedChange.emit(day.key);
  }
}
