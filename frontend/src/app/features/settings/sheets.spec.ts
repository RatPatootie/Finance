import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AmountSheet, AmountSheetData } from './amount.sheet';
import { PaydaySheet } from './payday.sheet';

function create<T>(component: Type<T>, data: unknown) {
  const dismiss = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      { provide: MAT_BOTTOM_SHEET_DATA, useValue: data },
      { provide: MatBottomSheetRef, useValue: { dismiss } },
    ],
  });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, dismiss };
}

describe('AmountSheet', () => {
  const press = (el: HTMLElement, keys: string) => {
    for (const k of keys) el.querySelector<HTMLButtonElement>(`[data-key="${k === '<' ? 'back' : k}"]`)!.click();
  };
  const amount = (el: HTMLElement) => el.querySelector('[data-testid="amount"]')!.textContent!.trim();

  it('uses the keypad only: no text input', () => {
    const { el } = create(AmountSheet, { title: 'Balance now', kopecks: null } satisfies AmountSheetData);
    expect(el.querySelector('input, textarea')).toBeNull();
    expect(el.querySelector('h2')!.textContent).toBe('Balance now');
  });

  it('typed 12000 and Save returns 1 200 000 kopecks', async () => {
    const { el, fixture, dismiss } = create(AmountSheet, { title: 'Balance now', kopecks: null });
    press(el, '12000');
    await fixture.whenStable();
    expect(amount(el)).toBe('12000');
    el.querySelector<HTMLButtonElement>('[data-testid="save-amount"]')!.click();
    expect(dismiss).toHaveBeenCalledWith(1_200_000);
  });

  it('is prefilled with the current value; Cancel returns nothing', async () => {
    const { el, fixture, dismiss } = create(AmountSheet, { title: 'Monthly income', kopecks: 3_000_050 });
    expect(amount(el)).toBe('30000.50');
    press(el, '<<<');
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('[data-testid="cancel-amount"]')!.click();
    expect(dismiss).toHaveBeenCalledWith(undefined);
  });

  it('adds up amounts: "10000 + 2000" shows a preview and Save stores the result', async () => {
    const { el, fixture, dismiss } = create(AmountSheet, { title: 'Balance now', kopecks: null });
    press(el, '10000+2000');
    await fixture.whenStable();
    expect(amount(el)).toBe('10000 + 2000');
    expect(el.querySelector('[data-testid="calc-result"]')!.textContent!.replace(/[  ]/g, ' ').trim()).toBe(
      '= 12 000,00 ₴',
    );
    el.querySelector<HTMLButtonElement>('[data-testid="save-amount"]')!.click();
    expect(dismiss).toHaveBeenCalledWith(1_200_000);
  });

  it('= replaces the expression with its result', async () => {
    const { el, fixture } = create(AmountSheet, { title: 'Balance now', kopecks: null });
    press(el, '8000+4500=');
    await fixture.whenStable();
    expect(amount(el)).toBe('12500');
  });

  it('an error blocks Save', async () => {
    const { el, fixture, dismiss } = create(AmountSheet, { title: 'Balance now', kopecks: null });
    press(el, '10-50');
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="calc-error"]')!.textContent).toContain('0 or more');
    const save = el.querySelector<HTMLButtonElement>('[data-testid="save-amount"]')!;
    expect(save.disabled).toBe(true);
    save.click();
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('with a maximum: blocks more than the maximum and 0, allows up to it', async () => {
    const { el, fixture, dismiss } = create(AmountSheet, {
      title: 'Return from Vacation',
      kopecks: null,
      max: 200_000,
      maxMessage: 'More than is frozen',
    });
    const save = () => el.querySelector<HTMLButtonElement>('[data-testid="save-amount"]')!;
    await fixture.whenStable();
    expect(save().disabled).toBe(true);
    press(el, '2500');
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="limit-error"]')!.textContent).toContain('More than is frozen');
    expect(save().disabled).toBe(true);
    press(el, '<<<<500');
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="limit-error"]')).toBeNull();
    save().click();
    expect(dismiss).toHaveBeenCalledWith(50_000);
  });

  it('an empty amount saves as 0', () => {
    const { el, dismiss } = create(AmountSheet, { title: 'Monthly income', kopecks: 0 });
    el.querySelector<HTMLButtonElement>('[data-testid="save-amount"]')!.click();
    expect(dismiss).toHaveBeenCalledWith(0);
  });
});

describe('PaydaySheet', () => {
  it('shows days 1-31 with the current one marked; a tap returns the day', () => {
    const { el, dismiss } = create(PaydaySheet, 1);
    expect(el.querySelectorAll('[data-day]')).toHaveLength(31);
    expect(el.querySelector('[data-day="1"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('[data-day="25"]')!.getAttribute('aria-pressed')).toBe('false');
    el.querySelector<HTMLButtonElement>('[data-day="25"]')!.click();
    expect(dismiss).toHaveBeenCalledWith(25);
  });
});
