// Integer math on both parts avoids float errors such as 0.29 * 100 = 28.999…
export function toKopecks(amount: string): number {
  if (amount === '') return 0;
  const [whole, fraction = ''] = amount.split('.');
  const hryvnias = whole === '' ? 0 : Number.parseInt(whole, 10);
  const kopecks = fraction === '' ? 0 : Number.parseInt(fraction.padEnd(2, '0').slice(0, 2), 10);
  return hryvnias * 100 + kopecks;
}

export function toAmountString(kopecks: number): string {
  const whole = Math.trunc(kopecks / 100);
  const fraction = kopecks % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}

const uahFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUah(kopecks: number): string {
  return `${uahFormat.format(kopecks / 100)} ₴`;
}
