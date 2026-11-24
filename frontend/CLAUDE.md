# Frontend rules

## Component files

- Move a component's template into its own `.html` file (`templateUrl`) when the inline template is longer than 10 lines.
- Move a component's styles into their own `.scss` file (`styleUrl`) when the inline styles are longer than 10 lines.
- When the inline template and styles together are longer than 15 lines, move both into separate files, even if each is 10 lines or fewer.
- Name the files after the component: `keypad.ts`, `keypad.html`, `keypad.scss`.

## Comments

- Don't write comments, including doc comments, in `.ts`, `.html` or `.scss` files.
- The only exception is logic a reader wouldn't expect: a workaround, a non-obvious rule or edge case, or a reason the obvious approach was not used. Say why in one short line.
- Don't comment what the code already says: names, types, what a function returns, or what a style does.

## RxJS

- Put observable logic in `pipe()` operators (`map`, `filter`, `switchMap`, `concatMap`, `tap`, `catchError`, `takeUntilDestroyed`, …), not inside `subscribe()`.
- `subscribe()` only starts the stream: call it with no callback, or with at most a trivial assignment. Don't branch, call services or start other streams inside it.
- Prefer turning a stream into a signal with `toSignal()`, or awaiting a one-off value with `firstValueFrom()`, over subscribing by hand.
- Unsubscribe with `takeUntilDestroyed()` in the pipe when the stream can outlive the component.
