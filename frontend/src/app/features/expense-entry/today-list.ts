import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CategoryRepository } from '../../core/db/category.repository';
import { Expense } from '../../core/db/models';
import { formatKyivTime } from '../../core/date/format';
import { formatUah } from '../../core/money/money';

@Component({
  selector: 'app-today-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-list.html',
  styleUrl: './today-list.scss',
})
export class TodayList {
  private readonly categories = inject(CategoryRepository);

  readonly expenses = input.required<readonly Expense[]>();
  readonly total = input.required<number>();
  readonly showTotal = input(true);
  readonly limit = input<number | null>(null);
  readonly edit = output<Expense>();

  protected readonly expanded = signal(false);
  protected readonly visible = computed(() => {
    const all = this.expenses();
    const max = this.limit();
    return max === null || this.expanded() ? all : all.slice(0, max);
  });
  protected readonly canToggle = computed(() => {
    const max = this.limit();
    return max !== null && this.expenses().length > max;
  });
  readonly remove = output<Expense>();

  protected readonly money = formatUah;
  protected readonly time = formatKyivTime;

  protected categoryName(e: Expense): string {
    return this.categories.byId(e.categoryId)?.name ?? '—';
  }
}
