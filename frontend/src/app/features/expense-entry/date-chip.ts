import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { formatDayLabel } from '../../core/date/format';
import { addDays, DateKey, dateKeyToPickerDate, pickerDateToDateKey } from '../../core/date/kyiv-date';

@Component({
  selector: 'app-date-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDatepickerModule],
  templateUrl: './date-chip.html',
  styleUrl: './date-chip.scss',
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
