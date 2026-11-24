import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-payday-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payday.sheet.html',
  styleUrl: './payday.sheet.scss',
})
export class PaydaySheet {
  private readonly ref = inject<MatBottomSheetRef<PaydaySheet, number>>(MatBottomSheetRef);
  protected readonly current = inject<number>(MAT_BOTTOM_SHEET_DATA);
  protected readonly days = Array.from({ length: 31 }, (_, i) => i + 1);

  protected pick(day: number): void {
    this.ref.dismiss(day);
  }
}
