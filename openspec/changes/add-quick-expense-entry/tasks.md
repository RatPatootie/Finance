# Tasks

All work is in `frontend/`. Run commands from that folder.

## 1. Setup

- [x] 1.1 Add `dexie` (dependency) and `fake-indexeddb` (dev dependency); verify `npm install` succeeds and `npm run build` still passes
- [x] 1.2 Delete the placeholder content from `app.html`/`app.scss`, leaving only `<router-outlet />`; update `app.spec.ts` so it no longer expects the placeholder title, and verify `npm test` passes
- [x] 1.3 Create the folders `core/db`, `core/money`, `core/date` and `features/expense-entry` under `src/app`, and verify they exist

## 2. Money utilities

- [x] 2.1 Implement the `applyKey(state, key)` keypad reducer in `core/money/keypad.ts` (digits, separator, backspace, max 2 decimals, single separator, leading-zero replacement, separator-first gives "0.", cap 9 999 999.99); verify `keypad.spec.ts` covers every amount scenario in specs/expense-entry
- [x] 2.2 Implement `toKopecks(str)` with integer math, plus `formatUah(kopecks)`, in `core/money/money.ts`; verify `money.spec.ts` covers "0.29" → 29, "49.99" → 4999, "125" → 12500, "0.5" → 50, empty/"0"/"0.00" → 0, the maximum value, and formatting 12500 → "125,00 ₴"

## 3. Kyiv date utilities

- [x] 3.1 Add a `Clock` injection token (default `() => new Date()`) in `core/date/clock.ts`
- [x] 3.2 Implement `kyivDateKey(instant)` and `msUntilNextKyivMidnight(instant)` in `core/date/kyiv-date.ts` with `Intl`; verify `kyiv-date.spec.ts` covers 23:30 and 00:10 Kyiv around the month boundary, 2026-02-28 → 03-01, the DST spring-forward (2026-03-29) and fall-back (2026-10-25) days, and an instant that is still the previous day in New York
- [x] 3.3 Add a `TodayService` with a `today` signal that refreshes on `visibilitychange` and at the next Kyiv midnight; verify a spec with a fake clock and fake timers shows the signal changing at midnight

## 4. Data layer

- [x] 4.1 Define the `Expense` and `Category` models (with doc comments on `date` vs `createdAt`) and `FinanceDb` `version(1)` with the tables and indexes from design.md; verify a spec using `fake-indexeddb` opens the database and finds both tables
- [x] 4.2 Implement `CategoryRepository`: `seedDefaultsIfEmpty()` in a transaction, an `active` signal (not hidden, not deleted, sorted), and `byId` lookup that includes hidden ones; verify a spec covers the seed order Food, Transport, Health, Shopping, Fun, no duplicate after a second call, and that hidden categories are excluded from `active` but still found by `byId`
- [x] 4.3 Implement `ExpenseRepository`: `add`, `update` (bumps `updatedAt`, keeps `id`/`createdAt`), `softDelete`, `restore`, and `forDate(dateKey)` as a live signal of non-deleted items, newest first; verify a spec covers each method, including that `softDelete` keeps the record with `isDeleted = 1`
- [x] 4.4 Add a pure `sumKopecks(expenses)` used for the day total; verify a spec covers an empty list → 0 and a mixed list → 12500
- [x] 4.5 Register `provideAppInitializer` to seed categories and call `navigator.storage.persist()` (ignore it when unsupported); verify the app starts with no console errors in `npm start`

## 5. Entry screen

- [x] 5.1 Build the `keypad` and `amount-display` components, wired to `applyKey`, with large touch targets and safe-area padding; verify a component spec where tapping 4, 9, separator, 9, 9 shows "49.99"
- [x] 5.2 Build the `category-grid` component (active categories only, disabled while the amount is 0 or a save is running, no add/edit controls); verify a component spec for the disabled state and that the button order matches the repository
- [x] 5.3 Build the `date-chip` component (shows "Today" or the chosen date, `mat-datepicker` with `max = today`); verify a spec that future dates are disabled and a non-today date is visibly labelled
- [x] 5.4 Build `expense-entry.page` as the `''` route: a category tap saves amount + category + date, clears the amount, resets the date to today and shows a confirmation snackbar; on a storage error it shows an error and keeps the amount. Verify page specs for save, the double-tap guard (one record after two fast taps), the past-date save and the error path.
- [x] 5.5 Build `today-list` (rows with amount, category name and time; total header; empty state; reacts to `today` changes); verify a spec that a past-dated expense is excluded and the total updates after a save

## 6. Delete and edit

- [x] 6.1 Add a delete button to each row, calling `softDelete` and showing an "Undo" snackbar for 6 s that calls `restore`; verify a spec for both delete-then-undo and delete-without-undo
- [x] 6.2 Add an edit bottom sheet (keypad, category selection, date chip, Save/Cancel) opened by tapping a row; verify specs for the amount change, moving to yesterday (leaves today's list), save disabled at zero, and cancel leaving the record unchanged

## 7. Integration checks

- [x] 7.1 Run `npm test` and `npm run build` and verify both pass with no warnings from the new code
- [x] 7.2 Run a production build locally (`npx http-server dist/frontend/browser` or similar), turn the network off in DevTools, and verify that save, list, edit, delete/undo all work and data survives a reload
- [x] 7.3 Check the screen at iPhone width (375×812) in DevTools and verify a typical expense takes amount + 1 tap, the keypad stays above the home-indicator area, and no iOS keyboard appears
- [x] 7.4 Update the README's feature list to mark quick entry as done, and verify that the run steps written there still work

## 8. Home screen and add button

- [x] 8.1 Make the theme follow the phone's light/dark setting; verify both schemes render correctly in the browser
- [x] 8.2 Add `features/home/home.page` as the `''` route (today's total as the main figure, today's list with edit and delete/undo, a fixed "+" add button with safe-area padding); verify a spec for the list, total, empty state, delete/undo, day rollover, and that the button navigates to `/add`
- [x] 8.3 Move entry to `/add` with a close button; a save navigates home and confirms; small category chips are always visible and inactive at 0; verify specs for close-without-saving, save-and-return, zero-amount taps ignored, and the earlier save/date/error cases
- [x] 8.4 Check both screens at 375×812 in light and dark, and verify that a typical expense takes "+", the amount, and one category tap

## Workflow follow-up

- Review the uncommitted changes with the user before committing.
- Archive the change with `/opsx:archive` after review.
- Next proposed change: category management in Settings (add/rename/hide), then `add-daily-limit`.
