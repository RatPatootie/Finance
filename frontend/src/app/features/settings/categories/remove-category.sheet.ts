import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CategoryRepository, RemoveTarget } from '../../../core/db/category.repository';
import { Category, categoryType, OTHER_CATEGORY_NAME } from '../../../core/db/models';

export interface RemoveCategoryData {
  category: Category;
  count: number;
}

export type RemoveCategoryResult = 'removed' | undefined;

interface TargetOption {
  target: RemoveTarget;
  label: string;
}

@Component({
  selector: 'app-remove-category-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remove-category.sheet.html',
  styleUrl: './remove-category.sheet.scss',
})
export class RemoveCategorySheet {
  private readonly ref = inject<MatBottomSheetRef<RemoveCategorySheet, RemoveCategoryResult>>(MatBottomSheetRef);
  private readonly repo = inject(CategoryRepository);
  protected readonly data = inject<RemoveCategoryData>(MAT_BOTTOM_SHEET_DATA);

  protected readonly options = computed<TargetOption[]>(() => {
    const own = this.data.category;
    const type = categoryType(own);
    const others = this.repo.listed().filter((c) => c.id !== own.id && categoryType(c) === type);
    if (type !== 'normal') return others.map((c) => ({ target: c.id, label: c.name }));
    const other = this.repo.findOther();
    const head: TargetOption[] =
      other?.id === own.id ? [] : [{ target: other?.id ?? 'other', label: other ? other.name : `${OTHER_CATEGORY_NAME} (new)` }];
    return [...head, ...others.filter((c) => c.id !== other?.id).map((c) => ({ target: c.id, label: c.name }))];
  });

  protected readonly picked = signal<RemoveTarget | null>(null);
  protected readonly target = computed(() => this.picked() ?? this.options()[0]?.target ?? null);
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  protected readonly blocked = computed(() => this.data.count > 0 && this.options().length === 0);

  protected async confirm(): Promise<void> {
    if (this.busy() || this.blocked()) return;
    this.busy.set(true);
    try {
      await this.repo.remove(this.data.category.id, this.data.count > 0 ? (this.target() ?? undefined) : undefined);
      this.ref.dismiss('removed');
    } catch (err) {
      console.error('Could not remove category', err);
      this.error.set("Couldn't remove. Nothing was changed.");
      this.busy.set(false);
    }
  }

  protected cancel(): void {
    this.ref.dismiss(undefined);
  }
}
