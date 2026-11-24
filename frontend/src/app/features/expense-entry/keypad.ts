import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { KeypadKey } from '../../core/money/keypad';

interface KeyDef {
  key: KeypadKey;
  label: string;
  aria: string;
}

const DIGITS: KeyDef[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => ({
  key: d as KeypadKey,
  label: d,
  aria: d,
}));

@Component({
  selector: 'app-keypad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="keypad" role="group" aria-label="Amount keypad">
      @for (k of keys; track k.key) {
        <button type="button" class="key" [attr.aria-label]="k.aria" [attr.data-key]="k.key" (click)="press.emit(k.key)">
          @if (k.key === 'back') {
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"
              />
            </svg>
          } @else {
            {{ k.label }}
          }
        </button>
      }
    </div>
  `,
  styles: `
    .keypad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
    }
    /* Plain digits: no tiles at rest, a soft wash only while pressed. */
    .key {
      height: 60px;
      border: 0;
      border-radius: 16px;
      background: transparent;
      color: var(--mat-sys-on-surface);
      font-family: inherit;
      font-size: 28px;
      font-weight: 400;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      display: grid;
      place-items: center;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
      transition: background-color 160ms cubic-bezier(0.25, 1, 0.5, 1);
    }
    .key[data-key='.'],
    .key[data-key='back'] {
      color: var(--mat-sys-on-surface-variant);
    }
    .key:active {
      background: var(--mat-sys-surface-container-high);
      transition-duration: 0ms;
    }
    .key:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }
  `,
})
export class Keypad {
  readonly press = output<KeypadKey>();
  protected readonly keys: KeyDef[] = [
    ...DIGITS,
    { key: '.', label: '.', aria: 'Decimal separator' },
    { key: '0', label: '0', aria: '0' },
    { key: 'back', label: '', aria: 'Backspace' },
  ];
}
