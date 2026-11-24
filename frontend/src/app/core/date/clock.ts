import { InjectionToken } from '@angular/core';

/** Returns the current instant. Injected so tests can pin time. */
export type Clock = () => Date;

export const CLOCK = new InjectionToken<Clock>('CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
