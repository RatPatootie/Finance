import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { CLOCK } from '../date/clock';
import { FINANCE_DB } from './finance-db';
import { Category, DEFAULT_CATEGORIES } from './models';

@Injectable({ providedIn: 'root' })
export class CategoryRepository {
  private readonly db = inject(FINANCE_DB);
  private readonly clock = inject(CLOCK);

  readonly all: Signal<Category[]> = toSignal(
    from(liveQuery(() => this.db.categories.orderBy('sortOrder').toArray())),
    { initialValue: [] },
  );

  readonly active = computed(() => this.all().filter((c) => !c.isHidden && !c.isDeleted));

  private readonly map = computed(() => new Map(this.all().map((c) => [c.id, c])));

  byId(id: string): Category | undefined {
    return this.map().get(id);
  }

  async seedDefaultsIfEmpty(): Promise<void> {
    await this.db.transaction('rw', this.db.categories, async () => {
      if ((await this.db.categories.count()) > 0) return;
      const updatedAt = this.clock().toISOString();
      await this.db.categories.bulkAdd(
        DEFAULT_CATEGORIES.map((name, i) => ({
          id: crypto.randomUUID(),
          name,
          sortOrder: i,
          isHidden: 0 as const,
          isDeleted: 0 as const,
          updatedAt,
        })),
      );
    });
  }
}
