import { applyKey, KeypadKey } from './keypad';

function type(keys: KeypadKey[], start = ''): string {
  return keys.reduce(applyKey, start);
}

describe('applyKey', () => {
  it('builds whole hryvnias', () => {
    expect(type(['1', '2', '5'])).toBe('125');
  });

  it('builds hryvnias and kopecks', () => {
    expect(type(['4', '9', '.', '9', '9'])).toBe('49.99');
  });

  it('ignores a third decimal digit', () => {
    expect(applyKey('10.50', '7')).toBe('10.50');
  });

  it('allows only one separator', () => {
    expect(applyKey('3.5', '.')).toBe('3.5');
    expect(applyKey('3.', '.')).toBe('3.');
  });

  it('replaces a leading zero', () => {
    expect(type(['0', '7'])).toBe('7');
    expect(type(['0', '0'])).toBe('0');
  });

  it('starts with "0." when the separator comes first', () => {
    expect(type(['.', '5'])).toBe('0.5');
  });

  it('keeps zero before the separator', () => {
    expect(type(['0', '.', '5'])).toBe('0.5');
  });

  it('backspace removes the last character', () => {
    expect(type(['back', 'back'], '12.3')).toBe('12');
    expect(applyKey('', 'back')).toBe('');
  });

  it('caps the amount at 9 999 999.99', () => {
    expect(applyKey('9999999', '9')).toBe('9999999');
    expect(type(['.', '9', '9', '9'], '9999999')).toBe('9999999.99');
  });
});
