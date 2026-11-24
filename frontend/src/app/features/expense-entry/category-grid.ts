import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Category } from '../../core/db/models';

// aria-disabled instead of disabled: a fast tap right after typing can land before the DOM re-renders.
@Component({
  selector: 'app-category-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-grid.html',
  styleUrl: './category-grid.scss',
})
export class CategoryGrid {
  readonly categories = input.required<readonly Category[]>();
  readonly disabled = input(false);
  readonly selectedId = input<string | undefined>(undefined);
  readonly picked = output<string>();
}
