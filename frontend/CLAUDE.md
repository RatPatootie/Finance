# Frontend rules

## User data

The app is deployed and has real users. Their data exists only in their browser's IndexedDB, with no server copy yet. Every change must keep it intact and correct.

- **Schema changes are additive only.**
  - Add a new `this.version(n + 1)` and never edit an existing `version()` block.
  - Never remove or rename a table, an index or a stored field.
  - Never change what an existing field means or the units it is stored in (amounts stay integer kopecks, dates stay Kyiv `YYYY-MM-DD` keys).
- **New fields are optional, with a default.** Code must read records written before the field existed, as `categoryType()` and `showFrozen ?? true` do. When old rows need a value written, do it in a Dexie `.upgrade()` callback, never in app start-up code.
- **Test every schema bump against old data.** Add a spec that writes rows the way the previous version did, opens the new version and checks that every row survives with the same meaning. See `finance-db.spec.ts`.
- **Never destroy data in app code.** No `db.delete()`, no clearing tables, no re-seeding or resetting settings over existing data. Deleting stays a soft delete (`isDeleted = 1`).
- **Calculations must still accept old records.** A change to the budget rules must give the same result for data that has no new fields, unless the plan says otherwise and the user agreed.
- **Keep the service-worker update path safe.** A user may run the old cached build for a while after a new one is deployed, so new data must not break the old build.
- **Plans list the data impact.** A change that touches stored data needs a "Migration Plan" in its design.md and an old-data test task in its tasks.md.

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
