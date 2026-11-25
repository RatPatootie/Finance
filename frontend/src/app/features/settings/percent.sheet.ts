import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { KeypadKey } from '../../core/money/keypad';
import { Keypad } from '../expense-entry/keypad';

export interface PercentSheetData {
  title: string;
  percent: number | null;
}

@Component({
  selector: 'app-percent-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Keypad],
  templateUrl: './percent.sheet.html',
  styleUrl: './percent.sheet.scss',
})
export class PercentSheet {
  private readonly ref = inject<MatBottomSheetRef<PercentSheet, number>>(MatBottomSheetRef);
  protected readonly data = inject<PercentSheetData>(MAT_BOTTOM_SHEET_DATA);

  protected readonly digits = signal(this.data.percent === null ? '' : String(this.data.percent));
  private readonly value = computed(() => (this.digits() === '' ? 0 : Number(this.digits())));
  protected readonly error = computed(() => (this.digits() !== '' && (this.value() < 1 || this.value() > 100) ? 'Use 1 to 100' : ''));
  protected readonly canSave = computed(() => this.digits() !== '' && !this.error());

  protected onKey(key: KeypadKey): void {
    if (key === '.') return;
    this.digits.update((d) => {
      if (key === 'back') return d.slice(0, -1);
      if (d === '0') return key;
      return d.length >= 3 ? d : d + key;
    });
  }

  protected cancel(): void {
    this.ref.dismiss(undefined);
  }

  protected save(): void {
    if (this.canSave()) this.ref.dismiss(this.value());
  }
}
