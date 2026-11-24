import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { applyKey, KeypadKey } from '../../core/money/keypad';
import { toAmountString, toKopecks } from '../../core/money/money';
import { AmountDisplay } from '../expense-entry/amount-display';
import { Keypad } from '../expense-entry/keypad';

export interface AmountSheetData {
  title: string;
  /** Current value in kopecks; null shows an empty amount. */
  kopecks: number | null;
}

/** Keypad sheet for an amount setting. Dismisses with kopecks on Save, undefined on Cancel. */
@Component({
  selector: 'app-amount-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountDisplay, Keypad],
  template: `
    <div class="sheet">
      <h2>{{ data.title }}</h2>
      <app-amount-display [amount]="amount()" />
      <app-keypad (press)="onKey($event)" />
      <div class="actions">
        <button type="button" class="btn text" data-testid="cancel-amount" (click)="cancel()">Cancel</button>
        <button type="button" class="btn filled" data-testid="save-amount" (click)="save()">Save</button>
      </div>
    </div>
  `,
  styles: `
    .sheet {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
    }
    h2 {
      margin: 0;
      font: var(--mat-sys-title-large);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .btn {
      min-width: 96px;
      height: 44px;
      padding: 0 20px;
      border-radius: 22px;
      border: 0;
      font: var(--mat-sys-label-large);
      cursor: pointer;
      touch-action: manipulation;
    }
    .text {
      background: transparent;
      color: var(--mat-sys-primary);
    }
    .filled {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
  `,
})
export class AmountSheet {
  private readonly ref = inject<MatBottomSheetRef<AmountSheet, number>>(MatBottomSheetRef);
  protected readonly data = inject<AmountSheetData>(MAT_BOTTOM_SHEET_DATA);
  protected readonly amount = signal(
    this.data.kopecks === null || this.data.kopecks <= 0 ? '' : toAmountString(this.data.kopecks),
  );

  protected onKey(key: KeypadKey): void {
    this.amount.update((s) => applyKey(s, key));
  }

  protected cancel(): void {
    this.ref.dismiss(undefined);
  }

  protected save(): void {
    this.ref.dismiss(toKopecks(this.amount()));
  }
}
