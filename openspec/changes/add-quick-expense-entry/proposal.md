# Proposal

## Why

The app is only a scaffold right now. Nothing can be recorded, and every later feature (daily limit, frozen amounts, statistics, export, sync) depends on having expenses stored on the device. Logging has to be fast enough to do at the checkout on an iPhone: amount → category → saved, in 2–3 taps.

## What Changes

**Touches: frontend only.** No backend changes. Sync comes later in `add-backend-sync`.

- Add a local IndexedDB database (Dexie.js) holding expenses and categories. Records already have the fields sync will need: client Guid `id`, `updatedAt`, `isDeleted`.
- Seed five default categories on first launch: **Food, Transport, Health, Shopping, Fun**.
- Add a **home screen** (Monobank-style): today's spending as the main figure, today's expenses below it, and an add button with a "+" icon at the bottom. Balance and "left for today" will take over the main figure in `add-daily-limit`.
- The add button opens an **entry screen**:
  - an on-screen amount keypad (UAH, stored as integer kopecks)
  - small category buttons between the amount and the keypad. Tapping one saves the expense and returns home (tap count: "+", digits, one category tap).
  - the date defaults to today (Europe/Kyiv). An optional date control lets you log a past day before you tap a category.
- **Delete** an expense with an Undo snackbar (soft delete through `isDeleted`).
- **Edit** an expense (amount, category, date) by tapping it in today's list.
- Follow the phone's light or dark setting.
- Remove the Angular placeholder page.

Out of scope (later changes): adding, renaming or hiding categories in a Settings screen; balance, daily limit, frozen amounts, statistics, export, backend sync. The entry screen will never have an "add category" button. New categories will be created only in Settings.

## Capabilities

### New Capabilities
- `expense-entry`: recording expenses on the device: the amount keypad, saving with a category tap, date defaulting and day boundaries, today's list and total, editing, deleting with undo, and offline persistence.
- `expense-categories`: the set of categories an expense can belong to: default seed, the fields each category has, and which categories show in the entry picker. Settings management will extend this capability later.

### Modified Capabilities
- None. No specs exist yet.

## Impact

- **Frontend:** new `core/db` (Dexie database and repositories), `core/money` and `core/date` utilities (kopeck parsing and formatting, Europe/Kyiv day keys), and a `features/expense-entry` standalone component tree. `app.routes.ts` and `app.html` are replaced.
- **Dependencies:** adds `dexie`. Angular Material is already present. If needed, it's set up for the snackbar, buttons, list and datepicker.
- **Backend:** none.
- **Offline:** everything works without a network. The service worker already caches the app shell in production builds.
