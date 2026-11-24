/** A key on the amount keypad. */
export type KeypadKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.'
  | 'back';

/** Max whole-hryvnia digits: 9 999 999.99 UAH is the largest amount. */
export const MAX_INTEGER_DIGITS = 7;
export const MAX_DECIMAL_DIGITS = 2;

/**
 * Pure reducer for the keypad. `state` is the typed amount as a string using
 * "." as separator ("" means nothing typed yet). Returns the new string.
 */
export function applyKey(state: string, key: KeypadKey): string {
  if (key === 'back') {
    return state.slice(0, -1);
  }

  const sepIndex = state.indexOf('.');

  if (key === '.') {
    if (sepIndex !== -1) return state;
    return state === '' ? '0.' : state + '.';
  }

  // Digit.
  if (sepIndex !== -1) {
    const decimals = state.length - sepIndex - 1;
    return decimals >= MAX_DECIMAL_DIGITS ? state : state + key;
  }
  if (state === '0') {
    return key; // replace the leading zero ("0" + "7" -> "7", "0" + "0" -> "0")
  }
  if (state.length >= MAX_INTEGER_DIGITS) {
    return state;
  }
  return state + key;
}
