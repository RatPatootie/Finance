import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Short messages, shown at the top so they never cover the keypad or the add button. */
@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string, action?: string, duration = 1500) {
    return this.snackBar.open(message, action, { duration, verticalPosition: 'top' });
  }
}
