import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { formatDayLabel } from '../../core/date/format';
import { addDays, DateKey, dateKeyToPickerDate, pickerDateToDateKey } from '../../core/date/kyiv-date';

/** Shows "Today" (or the chosen past day) and opens a date picker that has no future days. */
@Component({
  selector: 'app-date-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDatepickerModule],
  template: `
    <button type="button" class="chip" [class.past]="!isToday()" (click)="picker.open()" [attr.aria-label]="'Date: ' + label()">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
      </svg>
      <span data-testid="date-label">{{ label() }}</span>
    </button>
    <input
      class="hidden-input"
      tabindex="-1"
      aria-hidden="true"
      readonly
      [matDatepicker]="picker"
      [max]="maxDate()"
      [value]="pickerValue()"
      (dateChange)="onPicked($event.value)"
    />
    <mat-datepicker #picker [touchUi]="true" />
  `,
  styles: `
    :host {
      display: inline-flex;
      position: relative;
    }
    /* Quiet text button on "Today"; turns into a tinted pill for another day so it can't be missed. */
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      padding: 0 12px;
      border-radius: 22px;
      border: 0;
      background: transparent;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
      font-size: 15px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 160ms cubic-bezier(0.25, 1, 0.5, 1);
    }
    .chip svg {
      opacity: 0.7;
    }
    .chip:active {
      background: var(--mat-sys-surface-container-high);
    }
    .chip.past {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }
    .chip.past svg {
      opacity: 1;
    }
    .chip:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }
    .hidden-input {
      position: absolute;
      inset: 0;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
      border: 0;
      padding: 0;
    }
  `,
})
export class DateChip {
  readonly date = input.required<DateKey>();
  readonly today = input.required<DateKey>();
  readonly dateChange = output<DateKey>();

  protected readonly isToday = computed(() => this.date() === this.today());
  protected readonly label = computed(() => {
    if (this.isToday()) return 'Today';
    if (this.date() === addDays(this.today(), -1)) return `Yesterday · ${formatDayLabel(this.date())}`;
    return formatDayLabel(this.date());
  });
  protected readonly maxDate = computed(() => dateKeyToPickerDate(this.today()));
  protected readonly pickerValue = computed(() => dateKeyToPickerDate(this.date()));

  protected onPicked(value: Date | null): void {
    if (!value) return;
    const key = pickerDateToDateKey(value);
    // Never allow a future day, even if typed some other way.
    this.dateChange.emit(key > this.today() ? this.today() : key);
  }
}
