import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Category } from '../../core/db/models';

/**
 * Category buttons. In entry mode a tap saves the expense; in the editor
 * (`selectedId` set) a tap selects. There are no add/rename/delete controls here:
 * category management belongs to Settings.
 *
 * `disabled` is shown with aria-disabled and styling, not the native attribute:
 * a fast tap right after typing can arrive before the DOM re-renders, so the
 * parent decides from its own state whether a tap counts.
 */
@Component({
  selector: 'app-category-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid" role="group" aria-label="Category">
      @for (c of categories(); track c.id) {
        <button
          type="button"
          class="cat"
          [class.selected]="c.id === selectedId()"
          [attr.aria-pressed]="selectedId() === undefined ? null : c.id === selectedId()"
          [class.is-disabled]="disabled()"
          [attr.aria-disabled]="disabled() || null"
          (click)="picked.emit(c.id)"
        >
          {{ c.name }}
        </button>
      } @empty {
        <p class="none">No categories</p>
      }
    </div>
  `,
  styles: `
    /* Small chips that wrap and centre, so they sit lightly between the amount and the keypad. */
    .grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
    .cat {
      height: 36px;
      padding: 0 14px;
      border: 0;
      border-radius: 18px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font: var(--mat-sys-label-large);
      font-size: 14px;
      /* Invisible padding keeps the touch target near 44px tall. */
      position: relative;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      transition: opacity 120ms ease-out, transform 80ms ease-out;
    }
    .cat::after {
      content: '';
      position: absolute;
      inset: -4px 0;
    }
    .cat:active:not(.is-disabled) {
      transform: scale(0.96);
    }
    .cat.is-disabled {
      background: transparent;
      color: var(--mat-sys-on-surface-variant);
      box-shadow: inset 0 0 0 1px var(--mat-sys-outline-variant);
      cursor: default;
    }
    .cat.selected {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .cat:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }
    .none {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class CategoryGrid {
  readonly categories = input.required<readonly Category[]>();
  readonly disabled = input(false);
  /** Set in the editor to show which category is chosen. */
  readonly selectedId = input<string | undefined>(undefined);
  readonly picked = output<string>();
}
