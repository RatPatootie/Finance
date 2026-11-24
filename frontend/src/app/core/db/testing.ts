import { Provider } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FINANCE_DB, FinanceDb } from './finance-db';

let counter = 0;

export function provideTestDb(): { db: FinanceDb; providers: Provider[] } {
  const db = new FinanceDb(`test-${Date.now()}-${counter++}`);
  return { db, providers: [{ provide: FINANCE_DB, useValue: db }] };
}

export function waitFor<T>(source: Observable<T>, predicate: (value: T) => boolean): Promise<T> {
  return firstValueFrom(source.pipe(filter(predicate)));
}

export async function until<T>(read: () => T, predicate: (value: T) => boolean, timeoutMs = 2000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = read();
    if (predicate(value)) return value;
    if (Date.now() - start > timeoutMs) throw new Error('until(): timed out');
    await new Promise((r) => setTimeout(r, 10));
  }
}
