import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

/** Grid of days 1-31; one tap picks the payday. Dismisses with the day, or undefined. */
@Component({
  selector: 'app-payday-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sheet">
      <h2>Payday</h2>
      <p class="hint">Day of the month your income arrives. In shorter months it moves to the last day.</p>
      <div class="days" role="group" aria-label="Day of month">
        @for (d of days; track d) {
          <button
            type="button"
            class="day"
            [class.selected]="d === current"
            [attr.aria-pressed]="d === current"
            [attr.data-day]="d"
            (click)="pick(d)"
          >
            {{ d }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .sheet {
      padding: 8px 0 calc(16px + env(safe-area-inset-bottom));
    }
    h2 {
      margin: 0 0 4px;
      font: var(--mat-sys-title-large);
    }
    .hint {
      margin: 0 0 16px;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }
    .day {
      height: 44px;
      border: 0;
      border-radius: 22px;
      background: transparent;
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-body-large);
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .day:active {
      background: var(--mat-sys-surface-container-highest);
    }
    .day.selected {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
  `,
})
export class PaydaySheet {
  private readonly ref = inject<MatBottomSheetRef<PaydaySheet, number>>(MatBottomSheetRef);
  protected readonly current = inject<number>(MAT_BOTTOM_SHEET_DATA);
  protected readonly days = Array.from({ length: 31 }, (_, i) => i + 1);

  protected pick(day: number): void {
    this.ref.dismiss(day);
  }
}
