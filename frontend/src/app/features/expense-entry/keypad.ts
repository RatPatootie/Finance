import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CalcOperator } from '../../core/money/calc';
import { KeypadKey } from '../../core/money/keypad';

interface KeyDef {
  key: KeypadKey;
  label: string;
  aria: string;
}

const DIGITS: KeyDef[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => ({
  key: d as KeypadKey,
  label: d,
  aria: d,
}));

@Component({
  selector: 'app-keypad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './keypad.html',
  styleUrl: './keypad.scss',
})
export class Keypad {
  readonly operators = input(false);
  readonly press = output<KeypadKey>();
  readonly calc = output<CalcOperator | '='>();
  protected readonly ops: { key: CalcOperator | '='; label: string; aria: string }[] = [
    { key: '/', label: '÷', aria: 'Divide' },
    { key: '*', label: '×', aria: 'Multiply' },
    { key: '-', label: '−', aria: 'Minus' },
    { key: '+', label: '+', aria: 'Plus' },
    { key: '=', label: '=', aria: 'Equals' },
  ];
  protected readonly keys: KeyDef[] = [
    ...DIGITS,
    { key: '.', label: '.', aria: 'Decimal separator' },
    { key: '0', label: '0', aria: '0' },
    { key: 'back', label: '', aria: 'Backspace' },
  ];
}
