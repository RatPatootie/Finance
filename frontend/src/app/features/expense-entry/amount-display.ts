import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-amount-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './amount-display.html',
  styleUrl: './amount-display.scss',
})
export class AmountDisplay {
  readonly amount = input.required<string>();
}
