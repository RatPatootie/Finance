import { applyCalcKey, CalcKey, evaluate, formatExpression, hasOperation } from './calc';

/** Types keys; "x" is ×, ":" is ÷, "<" is backspace, "=" is equals. */
function type(keys: string, start = ''): string {
  const map: Record<string, CalcKey> = { x: '*', ':': '/', '<': 'back' };
  return [...keys].reduce((s, k) => applyCalcKey(s, (map[k] ?? k) as CalcKey), start);
}

describe('calculator', () => {
  it('adds two amounts: 8000 + 4500 = 12500', () => {
    expect(type('8000+4500=')).toBe('12500');
  });

  it('a result without = is still available', () => {
    expect(evaluate(type('10000+2000'))).toEqual({ kind: 'ok', kopecks: 1_200_000 });
  });

  it('multiplies before adding: 100 + 50 × 2 = 200', () => {
    expect(type('100+50x2=')).toBe('200');
  });

  it('divides and rounds to kopecks: 100 ÷ 3 = 33.33', () => {
    expect(type('100:3=')).toBe('33.33');
    expect(type('200:3=')).toBe('66.67');
  });

  it('subtracts and keeps decimals: 1000.50 − 0.75 = 999.75', () => {
    expect(type('1000.50-0.75=')).toBe('999.75');
  });

  it('multiplies by a fraction: 1000 × 0.5 = 500', () => {
    expect(type('1000x0.5=')).toBe('500');
  });

  it('a second operator replaces the first', () => {
    expect(type('100+-')).toBe('100-');
    expect(formatExpression(type('100+-'))).toBe('100 −');
  });

  it('ignores an operator before any number', () => {
    expect(type('+x5')).toBe('5');
  });

  it('backspace removes digits, then the operator', () => {
    expect(type('12+3<')).toBe('12+');
    expect(type('12+3<<')).toBe('12');
  });

  it('each number follows the keypad rules', () => {
    expect(type('1.239+0.5.5')).toBe('1.23+0.55');
    expect(type('12345678+1')).toBe('1234567+1');
  });

  it('division by zero is an error and = keeps the expression', () => {
    expect(evaluate(type('100:0'))).toEqual({ kind: 'error', message: "Can't divide by 0" });
    expect(type('100:0=')).toBe('100/0');
  });

  it('a negative result is an error', () => {
    expect(evaluate(type('10-50'))).toEqual({ kind: 'error', message: 'Must be 0 or more' });
  });

  it('a result above 9 999 999.99 is an error', () => {
    expect(evaluate(type('9999999+1'))).toEqual({ kind: 'error', message: 'Too large' });
    expect(evaluate(type('9999999x9999999'))).toMatchObject({ kind: 'error' });
  });

  it('ignores a trailing operator and treats empty as empty', () => {
    expect(evaluate('100+')).toEqual({ kind: 'ok', kopecks: 10_000 });
    expect(evaluate('')).toEqual({ kind: 'empty' });
  });

  it('formats for display and knows when there is an operation', () => {
    expect(formatExpression('100-5*2/4+1')).toBe('100 − 5 × 2 ÷ 4 + 1');
    expect(hasOperation('125.5')).toBe(false);
    expect(hasOperation('125+')).toBe(true);
  });
});
