import { Injectable, signal } from '@angular/core';
import { DateKey } from '../../core/date/kyiv-date';

// Kept outside the page so the chosen day survives a trip to the entry screen and back.
@Injectable({ providedIn: 'root' })
export class ChosenDay {
  readonly picked = signal<DateKey | null>(null);
}
