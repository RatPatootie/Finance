import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CLOCK } from './clock';
import { DateKey, kyivDateKey, msUntilNextKyivMidnight } from './kyiv-date';

// iOS pauses timers while the PWA is in the background, so also refresh when it becomes visible.
@Injectable({ providedIn: 'root' })
export class TodayService {
  private readonly clock = inject(CLOCK);
  private readonly document = inject(DOCUMENT);
  private readonly _today = signal<DateKey>(kyivDateKey(this.clock()));
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly today = this._today.asReadonly();

  constructor() {
    const onVisible = () => {
      if (this.document.visibilityState === 'visible') this.refresh();
    };
    this.document.addEventListener('visibilitychange', onVisible);
    this.schedule();
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(this.timer);
    });
  }

  refresh(): DateKey {
    const now = kyivDateKey(this.clock());
    if (now !== this._today()) this._today.set(now);
    return now;
  }

  private schedule(): void {
    clearTimeout(this.timer);
    // +1 s so the timer fires safely after the day boundary.
    const delay = msUntilNextKyivMidnight(this.clock()) + 1000;
    this.timer = setTimeout(() => {
      this.refresh();
      this.schedule();
    }, delay);
  }
}
