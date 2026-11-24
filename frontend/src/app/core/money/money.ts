/**
 * Converts a keypad amount string ("49.99", "0.5", "125", "") to integer kopecks.
 * Uses integer math on the two parts, never floating-point multiplication,
 * so values like "0.29" stay exact.
 */
export function toKopecks(amount: string): number {
  if (amount === '') return 0;
  const [whole, fraction = ''] = amount.split('.');
  const hryvnias = whole === '' ? 0 : Number.parseInt(whole, 10);
  const kopecks = fraction === '' ? 0 : Number.parseInt(fraction.padEnd(2, '0').slice(0, 2), 10);
  return hryvnias * 100 + kopecks;
}

/** Converts kopecks back to a keypad string, e.g. 4999 -> "49.99", 12500 -> "125". */
export function toAmountString(kopecks: number): string {
  const whole = Math.trunc(kopecks / 100);
  const fraction = kopecks % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}

const uahFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats kopecks for display, e.g. 12500 -> "125,00 ₴". */
export function formatUah(kopecks: number): string {
  return `${uahFormat.format(kopecks / 100)} ₴`;
}
