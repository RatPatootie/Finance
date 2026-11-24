import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-amount-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <output class="amount" [class.empty]="!amount()" aria-live="polite" aria-label="Amount">
      <span class="value" data-testid="amount">{{ amount() || '0' }}</span>
      <span class="currency">₴</span>
    </output>
  `,
  styles: `
    .amount {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 6px;
      font-variant-numeric: tabular-nums;
      min-height: 64px;
    }
    .value {
      font: var(--mat-sys-display-medium);
      letter-spacing: -0.02em;
    }
    .currency {
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .empty .value {
      color: var(--mat-sys-outline);
    }
  `,
})
export class AmountDisplay {
  /** Keypad string; empty shows a muted "0". */
  readonly amount = input.required<string>();
}
