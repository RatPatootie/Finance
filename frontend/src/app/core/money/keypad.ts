export type KeypadKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.'
  | 'back';

export const MAX_INTEGER_DIGITS = 7;
export const MAX_DECIMAL_DIGITS = 2;

export function applyKey(state: string, key: KeypadKey): string {
  if (key === 'back') {
    return state.slice(0, -1);
  }

  const sepIndex = state.indexOf('.');

  if (key === '.') {
    if (sepIndex !== -1) return state;
    return state === '' ? '0.' : state + '.';
  }

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
