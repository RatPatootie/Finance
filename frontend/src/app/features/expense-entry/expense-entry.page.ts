import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryRepository } from '../../core/db/category.repository';
import { ExpenseRepository } from '../../core/db/expense.repository';
import { categoryType } from '../../core/db/models';
import { DateKey } from '../../core/date/kyiv-date';
import { TodayService } from '../../core/date/today.service';
import { applyKey, KeypadKey } from '../../core/money/keypad';
import { formatUah, toKopecks } from '../../core/money/money';
import { Toast } from '../../core/ui/toast';
import { AmountDisplay } from './amount-display';
import { CategoryGrid } from './category-grid';
import { DateChip } from './date-chip';
import { Keypad } from './keypad';

@Component({
  selector: 'app-expense-entry-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountDisplay, CategoryGrid, DateChip, Keypad],
  templateUrl: './expense-entry.page.html',
  styleUrl: './expense-entry.page.scss',
})
export class ExpenseEntryPage {
  private readonly expenses = inject(ExpenseRepository);
  private readonly categoryRepo = inject(CategoryRepository);
  private readonly todayService = inject(TodayService);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  protected readonly today = this.todayService.today;
  protected readonly categories = this.categoryRepo.forEntry;

  protected readonly amount = signal('');
  protected readonly pickedDate = signal<DateKey | null>(this.dateFromLink());
  protected readonly saving = signal(false);

  protected readonly selectedDate = computed(() => this.pickedDate() ?? this.today());
  protected readonly kopecks = computed(() => toKopecks(this.amount()));
  protected readonly canSave = computed(() => this.kopecks() > 0 && !this.saving());

  private dateFromLink(): DateKey | null {
    const date = inject(ActivatedRoute).snapshot.queryParamMap.get('date');
    return date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date < this.today() ? date : null;
  }

  protected onKey(key: KeypadKey): void {
    this.amount.update((s) => applyKey(s, key));
  }

  protected onDatePicked(date: DateKey): void {
    this.pickedDate.set(date === this.today() ? null : date);
  }

  protected close(): void {
    void this.router.navigateByUrl('/');
  }

  async onCategory(categoryId: string): Promise<void> {
    if (!this.canSave()) return; // ignores taps at 0 and a second fast tap while saving
    this.saving.set(true);
    const amountKopecks = this.kopecks();
    // Re-read the clock: the app may have been left open past midnight.
    const date = this.pickedDate() ?? this.todayService.refresh();
    try {
      await this.expenses.add({ amountKopecks, categoryId, date });
      const category = this.categoryRepo.byId(categoryId);
      const verb = category && categoryType(category) === 'frozen' ? 'Frozen' : 'Saved';
      this.toast.show(`${verb} ${formatUah(amountKopecks)} · ${category?.name ?? ''}`);
      await this.router.navigateByUrl('/');
    } catch (err) {
      console.error('Could not save expense', err);
      this.toast.show("Couldn't save. Your amount is kept — try again.", 'OK', 5000);
      this.saving.set(false);
    }
  }
}
