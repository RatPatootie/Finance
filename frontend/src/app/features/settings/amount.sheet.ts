import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { applyCalcKey, CalcKey, evaluate, formatExpression, hasOperation } from '../../core/money/calc';
import { formatUah, toAmountString } from '../../core/money/money';
import { AmountDisplay } from '../expense-entry/amount-display';
import { Keypad } from '../expense-entry/keypad';

export interface AmountSheetData {
  title: string;
  kopecks: number | null;
}

@Component({
  selector: 'app-amount-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountDisplay, Keypad],
  templateUrl: './amount.sheet.html',
  styleUrl: './amount.sheet.scss',
})
export class AmountSheet {
  private readonly ref = inject<MatBottomSheetRef<AmountSheet, number>>(MatBottomSheetRef);
  protected readonly data = inject<AmountSheetData>(MAT_BOTTOM_SHEET_DATA);
  protected readonly money = formatUah;

  protected readonly expr = signal(
    this.data.kopecks === null || this.data.kopecks <= 0 ? '' : toAmountString(this.data.kopecks),
  );
  protected readonly hasOp = computed(() => hasOperation(this.expr()));
  protected readonly pretty = computed(() => formatExpression(this.expr()));
  protected readonly result = computed(() => evaluate(this.expr()));
  protected readonly canSave = computed(() => this.result().kind !== 'error');

  protected onKey(key: CalcKey): void {
    this.expr.update((s) => applyCalcKey(s, key));
  }

  protected cancel(): void {
    this.ref.dismiss(undefined);
  }

  protected save(): void {
    const r = this.result();
    if (r.kind === 'error') return;
    this.ref.dismiss(r.kind === 'ok' ? r.kopecks : 0);
  }
}
