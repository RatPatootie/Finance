import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CategoryRepository } from '../../core/db/category.repository';
import { Expense } from '../../core/db/models';
import { formatKyivTime } from '../../core/date/format';
import { formatUah } from '../../core/money/money';

@Component({
  selector: 'app-today-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="today-heading">
      <header class="head">
        <h2 id="today-heading">Today</h2>
        @if (showTotal()) {
          <span class="total" data-testid="today-total">{{ money(total()) }}</span>
        }
      </header>

      @if (expenses().length === 0) {
        <p class="empty" data-testid="today-empty">Nothing spent today yet.</p>
      } @else {
        <ul class="list">
          @for (e of expenses(); track e.id) {
            <li class="row" data-testid="expense-row">
              <button type="button" class="main" (click)="edit.emit(e)" [attr.aria-label]="'Edit ' + categoryName(e) + ' ' + money(e.amountKopecks)">
                <span class="cat">{{ categoryName(e) }}</span>
                <span class="time">{{ time(e.createdAt) }}</span>
                <span class="amt">{{ money(e.amountKopecks) }}</span>
              </button>
              <button type="button" class="del" (click)="remove.emit(e)" [attr.aria-label]="'Delete ' + categoryName(e) + ' ' + money(e.amountKopecks)">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5-1-1h-5l-1 1H5v2h14V4h-3.5z" />
                </svg>
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 0 4px 8px;
    }
    h2 {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }
    .total {
      font: var(--mat-sys-title-medium);
      font-variant-numeric: tabular-nums;
    }
    .empty {
      margin: 0;
      padding: 16px 4px;
      color: var(--mat-sys-on-surface-variant);
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .row {
      display: flex;
      align-items: center;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .main {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas: 'cat amt' 'time amt';
      align-items: center;
      gap: 0 12px;
      min-height: 56px;
      padding: 8px 4px;
      border: 0;
      background: transparent;
      color: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .cat {
      grid-area: cat;
      font: var(--mat-sys-body-large);
    }
    .time {
      grid-area: time;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .amt {
      grid-area: amt;
      font: var(--mat-sys-title-medium);
      font-variant-numeric: tabular-nums;
    }
    .del {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 24px;
      background: transparent;
      color: var(--mat-sys-on-surface-variant);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .main:focus-visible,
    .del:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: -2px;
    }
  `,
})
export class TodayList {
  private readonly categories = inject(CategoryRepository);

  readonly expenses = input.required<readonly Expense[]>();
  readonly total = input.required<number>();
  /** Off when the screen already shows the total as its main figure. */
  readonly showTotal = input(true);
  readonly edit = output<Expense>();
  readonly remove = output<Expense>();

  protected readonly money = formatUah;
  protected readonly time = formatKyivTime;

  protected categoryName(e: Expense): string {
    return this.categories.byId(e.categoryId)?.name ?? '—';
  }
}
