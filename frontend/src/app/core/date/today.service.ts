import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CLOCK } from './clock';
import { DateKey, kyivDateKey, msUntilNextKyivMidnight } from './kyiv-date';

/**
 * Holds today's Kyiv date as a signal. It refreshes at the next Kyiv midnight
 * and whenever the app comes back to the foreground (timers are paused while
 * iOS keeps the PWA in the background).
 */
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

  /** Re-reads the clock. Returns the current day key. */
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
