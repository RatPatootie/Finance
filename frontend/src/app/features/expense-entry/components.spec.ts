import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInput } from '@angular/material/datepicker';
import { Category } from '../../core/db/models';
import { applyKey, KeypadKey } from '../../core/money/keypad';
import { AmountDisplay } from './amount-display';
import { CategoryGrid } from './category-grid';
import { DateChip } from './date-chip';
import { Keypad } from './keypad';

function cat(id: string, name: string, sortOrder: number): Category {
  return { id, name, sortOrder, isHidden: 0, isDeleted: 0, updatedAt: '2026-11-23T00:00:00.000Z' };
}

@Component({
  imports: [Keypad, AmountDisplay],
  template: `<app-amount-display [amount]="amount()" /><app-keypad (press)="onKey($event)" />`,
})
class KeypadHost {
  amount = signal('');
  onKey(k: KeypadKey) {
    this.amount.update((s) => applyKey(s, k));
  }
}

describe('Keypad + AmountDisplay', () => {
  it('tapping 4, 9, separator, 9, 9 shows 49.99', async () => {
    const fixture = TestBed.createComponent(KeypadHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    for (const k of ['4', '9', '.', '9', '9']) {
      el.querySelector<HTMLButtonElement>(`[data-key="${k}"]`)!.click();
    }
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="amount"]')!.textContent!.trim()).toBe('49.99');
  });

  it('shows a muted 0 when empty', async () => {
    const fixture = TestBed.createComponent(KeypadHost);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="amount"]')!.textContent!.trim()).toBe('0');
  });
});

@Component({
  imports: [CategoryGrid],
  template: `<app-category-grid [categories]="cats()" [disabled]="disabled()" (picked)="picked.push($event)" />`,
})
class GridHost {
  cats = signal<Category[]>([cat('a', 'Food', 0), cat('b', 'Transport', 1), cat('c', 'Health', 2)]);
  disabled = signal(true);
  picked: string[] = [];
}

describe('CategoryGrid', () => {
  it('shows buttons in the given order and has no add/edit controls', async () => {
    const fixture = TestBed.createComponent(GridHost);
    await fixture.whenStable();
    const buttons = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
    expect(buttons.map((b) => b.textContent!.trim())).toEqual(['Food', 'Transport', 'Health']);
    expect(buttons.some((b) => /add|new|edit|rename/i.test(b.textContent ?? ''))).toBe(false);
  });

  it('marks every button disabled while disabled, and emits when enabled', async () => {
    const fixture = TestBed.createComponent(GridHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('button')].every((b) => b.getAttribute('aria-disabled') === 'true')).toBe(true);

    fixture.componentInstance.disabled.set(false);
    await fixture.whenStable();
    expect(el.querySelector('button')!.hasAttribute('aria-disabled')).toBe(false);
    el.querySelectorAll('button')[1].click();
    expect(fixture.componentInstance.picked).toEqual(['b']);
  });
});

@Component({
  imports: [DateChip],
  template: `<app-date-chip [date]="date()" [today]="today" (dateChange)="date.set($event)" />`,
})
class DateHost {
  today = '2026-11-23';
  date = signal('2026-11-23');
}

describe('DateChip', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideNativeDateAdapter()] });
  });

  it('shows "Today" for today and a visible label for another day', async () => {
    const fixture = TestBed.createComponent(DateHost);
    await fixture.whenStable();
    const label = () => (fixture.nativeElement as HTMLElement).querySelector('[data-testid="date-label"]')!.textContent!.trim();
    const chip = () => (fixture.nativeElement as HTMLElement).querySelector('.chip')!;
    expect(label()).toBe('Today');
    expect(chip().classList.contains('past')).toBe(false);

    fixture.componentInstance.date.set('2026-11-22');
    await fixture.whenStable();
    expect(label()).toBe('Yesterday · Sun 22 Nov');
    expect(chip().classList.contains('past')).toBe(true);

    fixture.componentInstance.date.set('2026-11-10');
    await fixture.whenStable();
    expect(label()).toBe('Tue 10 Nov');
  });

  it('limits the picker to today and clamps a future pick', async () => {
    const fixture = TestBed.createComponent(DateHost);
    await fixture.whenStable();
    const input = fixture.debugElement.query(By.directive(MatDatepickerInput)).injector.get(MatDatepickerInput<Date>);
    expect(input.max).toEqual(new Date(2026, 10, 23));

    const chip = fixture.debugElement.query(By.directive(DateChip)).componentInstance as DateChip;
    (chip as unknown as { onPicked(d: Date): void }).onPicked(new Date(2026, 10, 30));
    expect(fixture.componentInstance.date()).toBe('2026-11-23');
  });
});
