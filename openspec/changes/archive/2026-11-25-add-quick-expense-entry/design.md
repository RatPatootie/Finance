# Design

## Context

`frontend/` is a fresh Angular 22 scaffold: standalone `App` with an empty route list, the placeholder template, a service worker that is only enabled in production builds, Angular Material themed with the Azure/Blue palette, and Vitest through `@angular/build:unit-test`. There is no data layer yet. See proposal.md for the motivation and specs/ for the required behaviour.

## Goals / Non-Goals

**Goals:**
- Set up a data layer (database, repositories, money and date utilities) that later changes (daily limit, frozen amounts, statistics, export, sync) can build on without migrations churn.
- Put all calculation and parsing logic in pure functions that are easy to unit-test.

**Non-Goals:**
- Category management UI, any backend or network code, and the balance or limit display.
- Multiple currencies or locales other than UAH and a dot or comma separator.

## Decisions

### 1. Dexie.js on IndexedDB, with a versioned schema
One `FinanceDb` (Dexie) with two tables:

| Table | Primary key | Indexes | Fields |
|---|---|---|---|
| `expenses` | `id` (uuid string) | `date`, `updatedAt`, `[isDeleted+date]` | `amountKopecks: number`, `categoryId`, `date: 'YYYY-MM-DD'`, `createdAt`, `updatedAt` (ISO UTC strings), `isDeleted: 0 \| 1` |
| `categories` | `id` (uuid) | `sortOrder`, `updatedAt` | `name`, `sortOrder`, `isHidden: 0 \| 1`, `updatedAt`, `isDeleted: 0 \| 1` |

- The booleans are stored as `0/1` because IndexedDB can't index booleans, and `[isDeleted+date]` makes "today, not deleted" a single index range.
- `updatedAt` is indexed now, so `add-backend-sync` can query "changed since X" without a schema bump.
- Ids come from `crypto.randomUUID()`, which is available in iOS Safari 15.4+.
- *Alternatives:* raw IndexedDB (too much boilerplate) and localStorage (synchronous, about 5 MB, can't query). Dexie is the project's chosen stack.

### 2. Repositories expose signals through `liveQuery`
`ExpenseRepository` and `CategoryRepository` are `providedIn: 'root'` services. Reads come from Dexie `liveQuery` and are turned into signals (wrapped as an Observable, then `toSignal`). Today's list and total update on their own after a save, edit, delete or undo, with no manual refresh. Writes are plain async methods: `add`, `update`, `softDelete`, `restore`.
- *Alternative:* a signal store updated by hand after each write. More code, and it can drift from the database.

### 3. Money is integer kopecks, parsed from keypad state
`core/money`:
- `KeypadState` is just the typed string. `applyKey(state, key)` is a pure reducer with these rules: one separator, at most 2 decimals, a leading-zero replacement, a cap of 9 999 999.99, and backspace.
- `toKopecks(str)` does integer math on the split string, never `parseFloat * 100`, to avoid float error (for example `0.29 * 100 = 28.999…`).
- `formatUah(kopecks)` uses `Intl.NumberFormat('uk-UA', {minimumFractionDigits: 2})` + ` ₴`.
- The custom keypad (not `<input type="number">`) avoids the iOS keyboard popping up, the comma/dot locale mismatch and zoom-on-focus. It's also what makes "2–3 taps" possible.

### 4. Kyiv day keys from `Intl`, no date library
`core/date`:
- `kyivDateKey(instant: Date): string` uses `Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Kyiv'})`, which gives `YYYY-MM-DD` and handles DST through the browser's tz data.
- `todayKey(clock)` takes an injectable `Clock` (a `now()` token) so tests can pin times across midnight and DST.
- A `today` signal re-evaluates on `visibilitychange` and on a timer set to the next Kyiv midnight. That covers the "app left open past midnight" scenarios.
- *Alternatives:* date-fns-tz or Luxon. Each adds a dependency for one function that `Intl` already does.

### 5. Category seeding in an app initializer
`provideAppInitializer` runs `CategoryRepository.seedDefaultsIfEmpty()`. It writes inside a Dexie `rw` transaction that first checks `count() === 0`, so two tabs starting at once can't seed twice. The default names live in one constant, `DEFAULT_CATEGORIES`.

### 6. UI structure
- Two lazy routes. `features/home/home.page` is `''`: today's total as the main figure (balance and "left for today" replace it in `add-daily-limit`), `today-list` below, and a fixed "+" add button at the bottom. `features/expense-entry/expense-entry.page` is `/add`: a full screen with a close button, holding the state signals amount, selected date and saving. Saving or closing navigates back to `''`. A full route rather than a sheet keeps the keypad at full size and makes the phone's back gesture close it.
- Entry children: `amount-display`, small `category-grid` chips between the amount and the keypad (always visible; they look inactive while the amount is 0, and taps are ignored while the amount is 0 or a save is running, which is the double-tap guard), `keypad` (plain digits, no tiles), and `date-chip` (shows "Today" or the chosen date and opens a `mat-datepicker` with `max = today`). `today-list` (total header and empty state) lives on home.
- The theme uses Material's `color-scheme` theme type with `color-scheme: light dark`, so it follows the phone's setting.
- **Delete:** a trailing icon button on each row. It calls `softDelete`, then `MatSnackBar.open('Deleted', 'Undo', {duration: 6000})`. Undo calls `restore(id)`. Swipe-to-delete is a later polish item.
- **Edit:** tapping a row opens a `MatBottomSheet` that reuses `keypad`, `category-grid` (selection mode, not save-on-tap) and `date-chip`. It has Save and Cancel buttons.
- The save confirmation is a short snackbar with no action. An error snackbar keeps the amount (see the spec's storage-failure scenario).
- Layout is mobile-first, with the keypad anchored to the bottom (thumb reach) and `env(safe-area-inset-bottom)` padding for the iPhone home indicator.

### 7. Folder layout
```
src/app/
  core/db/          finance-db.ts, expense.repository.ts, category.repository.ts, models.ts
  core/money/       keypad.ts, money.ts (+ .spec.ts)
  core/date/        clock.ts, kyiv-date.ts (+ .spec.ts)
  features/expense-entry/   page + child components (+ specs)
```

## Risks / Trade-offs

- **Safari can evict IndexedDB:** iOS may clear a site's storage if it isn't used for weeks, unless the PWA is installed to the Home Screen. → Call `navigator.storage.persist()` at startup. Backend sync (change 7) is the real backup. The README and first-run instructions will say to install to the Home Screen.
- **Stored `date` vs timestamps:** `date` is the user-facing day, which can be in the past, while `createdAt` is the real instant. Later statistics must group by `date`, not `createdAt`. → Both are written down in models.ts doc comments.
- **Tests need IndexedDB in jsdom:** jsdom has no IndexedDB. → Add `fake-indexeddb` as a dev dependency for repository tests. Pure functions don't need it.
- **Material bundle size:** snackbar, bottom sheet and datepicker add weight. → They're acceptable for a single-user app. Only standalone imports are used, so tree-shaking applies.

## Migration Plan

This is the first data schema (Dexie `version(1)`), so nothing needs migrating. Later changes add `version(n)` upgrades. The Angular placeholder template is deleted. Rollback means reverting the commit. Data already on a device stays in IndexedDB and is harmless.
