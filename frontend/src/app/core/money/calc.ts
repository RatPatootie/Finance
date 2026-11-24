import { applyKey, KeypadKey } from './keypad';
import { toAmountString, toKopecks } from './money';

export type CalcOperator = '+' | '-' | '*' | '/';
export type CalcKey = KeypadKey | CalcOperator | '=';

export type CalcResult =
  | { kind: 'empty' }
  | { kind: 'ok'; kopecks: number }
  | { kind: 'error'; message: string };

export const CALC_MAX_KOPECKS = 999_999_999;

const OPERATORS = '+-*/';
const isOperator = (c: string): c is CalcOperator => OPERATORS.includes(c);

function splitLast(expr: string): [string, string] {
  let i = expr.length - 1;
  while (i >= 0 && !isOperator(expr[i])) i--;
  return [expr.slice(0, i + 1), expr.slice(i + 1)];
}

export function applyCalcKey(expr: string, key: CalcKey): string {
  const [prefix, operand] = splitLast(expr);

  if (key === '=') {
    const result = evaluate(expr);
    return result.kind === 'ok' ? toAmountString(result.kopecks) : expr;
  }
  if (isOperator(key)) {
    if (expr === '') return expr;
    if (operand === '') return expr.slice(0, -1) + key;
    return expr + key;
  }
  if (key === 'back' && operand === '') return expr.slice(0, -1);
  return prefix + applyKey(operand, key);
}

export function hasOperation(expr: string): boolean {
  return [...expr].some(isOperator);
}

export function formatExpression(expr: string): string {
  return expr.replace(/[+\-*/]/g, (op) => ` ${{ '+': '+', '-': '−', '*': '×', '/': '÷' }[op]} `).trim();
}

// The right-hand side of × and ÷ is a plain number (2, 0.5), not an amount in kopecks.
export function evaluate(expr: string): CalcResult {
  const source = expr !== '' && isOperator(expr[expr.length - 1]) ? expr.slice(0, -1) : expr;
  if (source === '') return { kind: 'empty' };

  const tokens = source.split(/([+\-*/])/);
  let total = 0;
  let term = toKopecks(tokens[0]);
  let sign = 1;

  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i] as CalcOperator;
    const value = toKopecks(tokens[i + 1]);
    if (op === '*') {
      term = Math.round((term * value) / 100);
    } else if (op === '/') {
      if (value === 0) return { kind: 'error', message: "Can't divide by 0" };
      term = Math.round((term * 100) / value);
    } else {
      total += sign * term;
      sign = op === '+' ? 1 : -1;
      term = value;
    }
    if (Math.abs(term) > CALC_MAX_KOPECKS * 100) return { kind: 'error', message: 'Too large' };
  }
  total += sign * term;

  if (total < 0) return { kind: 'error', message: 'Must be 0 or more' };
  if (total > CALC_MAX_KOPECKS) return { kind: 'error', message: 'Too large' };
  return { kind: 'ok', kopecks: total };
}
