import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CategoryNameError, CategoryNameProblem, CategoryRepository } from '../../../core/db/category.repository';
import { Category, CATEGORY_NAME_MAX, CategoryType, categoryType } from '../../../core/db/models';

export interface CategorySheetData {
  category?: Category;
}

export type CategorySheetResult = 'added' | 'renamed' | 'remove' | undefined;

const MESSAGES: Record<CategoryNameProblem, string> = {
  empty: 'Enter a name',
  'too-long': `Use ${CATEGORY_NAME_MAX} characters or fewer`,
  duplicate: 'This name is already used',
};

@Component({
  selector: 'app-category-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category.sheet.html',
  styleUrl: './category.sheet.scss',
})
export class CategorySheet {
  private readonly ref = inject<MatBottomSheetRef<CategorySheet, CategorySheetResult>>(MatBottomSheetRef);
  private readonly repo = inject(CategoryRepository);
  protected readonly category = inject<CategorySheetData>(MAT_BOTTOM_SHEET_DATA).category;

  protected readonly maxLength = CATEGORY_NAME_MAX;
  protected readonly name = signal(this.category?.name ?? '');
  protected readonly type = signal<CategoryType>(this.category ? categoryType(this.category) : 'normal');
  protected readonly error = signal('');
  protected readonly saving = signal(false);

  protected onInput(value: string): void {
    this.name.set(value);
    this.error.set('');
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      if (this.category) {
        await this.repo.rename(this.category.id, this.name());
        this.ref.dismiss('renamed');
      } else {
        await this.repo.add(this.name(), this.type());
        this.ref.dismiss('added');
      }
    } catch (err) {
      this.saving.set(false);
      if (err instanceof CategoryNameError) {
        this.error.set(MESSAGES[err.problem]);
      } else {
        console.error('Could not save category', err);
        this.error.set("Couldn't save. Try again.");
      }
    }
  }

  protected remove(): void {
    this.ref.dismiss('remove');
  }

  protected cancel(): void {
    this.ref.dismiss(undefined);
  }
}
