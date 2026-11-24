# Design

## Context

- **What exists** (from `add-quick-expense-entry`):
  - expenses in Dexie (`FinanceDb` version 1), with a Kyiv `date` key, a real-time `createdAt` and soft delete;
  - `TodayService` with a `today` signal that changes at Kyiv midnight;
  - money as integer kopecks with `formatUah`;
  - the `Keypad` and `AmountDisplay` components with the `applyKey` reducer;
  - a home screen that shows "Spent today" as a placeholder hero.
- **Constraints:**
  - all calculation runs on the client;
  - the app must work offline;
  - records keep `updatedAt`/`isDeleted` so `add-backend-sync` can sync them later;
  - the initial bundle stays under the 500 kB budget.

## Goals / Non-Goals

**Goals:**
- Pure, fully unit-tested calculation functions with no Angular or Dexie inside.
- Live figures: the hero updates after any expense add/edit/delete, any settings change, and at Kyiv midnight, without a reload.

**Non-Goals:**
- Frozen amounts (`add-frozen-amounts`).
- Forecast and statistics (`add-statistics`).
- One-off income entries, and an income history beyond "monthly income on payday".
- Category management in Settings. It comes later on the same screen.

## Decisions

### 1. Settings as one record in a new `settings` table (Dexie version 2)
- `settings: 'id'`, with a single row `id = 'budget'`.
- Fields:
  - `balanceKopecks: number | null`;
  - `balanceSetAt: string | null` (ISO instant);
  - `balanceDate: DateKey | null` (the Kyiv day of `balanceSetAt`, stored so the calculation doesn't depend on the time zone);
  - `monthlyIncomeKopecks: number` (default 0);
  - `payday: number` (default 1);
  - `updatedAt`.
- `version(2)` only adds the table. Dexie keeps the version-1 stores and data, and no upgrade function is needed.
- A missing row means "not set up" and reads as defaults.

*Why one row and not key-value pairs:* the three values change together and sync as a unit (last write wins on one `updatedAt`).

*Alternative:* `localStorage`. Rejected: it isn't synced, it's separate from the IndexedDB data and it's easier to lose on iOS.

### 2. A balance anchor instead of stored running totals
The balance is never written back after expenses. It is derived as: saved balance + income × paydays in (balanceDate, today] − counted expenses.

An expense is counted when it isn't deleted and either:
- `date > balanceDate`, or
- `date == balanceDate` and `createdAt >= balanceSetAt`.

Re-saving the balance just moves the anchor.

*Why:* edits, deletes, backdated entries and future sync merges all stay correct with no bookkeeping, and there is a single source of truth.

*Cost:* counting reads the expenses dated on or after `balanceDate`, which uses the existing `date` index. That is at most a few hundred rows a month. The query is a `liveQuery` on `expenses.where('date').aboveOrEqual(balanceDate)`.

*Alternative:* a stored running balance updated on each write. Rejected because it drifts with edits, restores and sync.

### 3. The limit uses the balance at the start of the day
- startOfDayFree = balance + countedSpentToday.
- limit = max(0, floor(startOfDayFree / daysLeft)).
- left = limit − countedSpentToday.

*Why:* computing the limit from the live balance would lower the limit after each expense and count today's spending twice. Income that arrives today is part of the start-of-day money.

*Edge case:* on the day the balance is saved, expenses recorded earlier that day are already inside the balance and are not counted. They still appear in today's list but don't reduce "left for today". This is accepted and documented, and it only affects that one day.

### 4. Pure functions in `core/budget/budget.ts`
- **Functions:**
  - `daysLeftInMonth(today)`;
  - `paydaysBetween(fromExclusive, toInclusive, payday)`, which clamps the payday to the month's length;
  - `isCounted(expense, settings)`;
  - `computeBudget(settings, expenses, today)`, which returns `{ balance, limit, spentToday, left, status } | null` (null when no balance is set).
- **Status:**
  - `'red'` if `limit <= 0` or `left < 0`;
  - otherwise `'yellow'` if `spent * 5 >= limit * 4` (integer math for the 80 % threshold);
  - otherwise `'green'`.
- **Date math** works on Kyiv date keys only, using `addDays` and the day count from the year and month in the key, so DST can't affect it.

A `BudgetService` combines `settings` (liveQuery → signal), the expenses since the anchor (a liveQuery that restarts when `balanceDate` changes) and `TodayService.today` into one `budget` computed signal.

### 5. Settings UI
- A lazy `/settings` route with a top bar (back arrow to `/`) and three list rows: Balance, Monthly income, Payday.
- Tapping Balance or Monthly income opens a bottom sheet with `AmountDisplay`, `Keypad` and Save/Cancel. These are the components the entry screen uses, prefilled with `toAmountString(value)`.
- Payday opens a sheet with a 7-column grid of days 1–31. One tap saves it.
- The sheets load on demand, so they don't add to the initial bundle.

*Why not a native input:* the user explicitly prefers the keypad, and the iOS keyboard covers half the screen.

### 6. Home hero
- **Layout:**
  - a small label "Balance";
  - the balance as the large figure (the current 44 px style);
  - one line underneath: "Left today 1 414,28 ₴ · of 1 714,28 ₴" or "Over by 120,00 ₴";
  - a small status dot and text coloured by status.
- **Colours** are theme-aware and must work in light and dark:
  - green from a custom token;
  - yellow from the M3 tertiary-like amber token;
  - red from `--mat-sys-error`.
  - Contrast is checked in both schemes.
- **Before set-up:** the hero is a tonal card, "Set your balance to see your daily limit", that navigates to `/settings`.
- **Gear:** an icon button in the top-right corner of the home page.

## Risks / Trade-offs

- **[Settings saved on one device and expenses on another before sync]** → Sync is out of scope. The anchor uses `createdAt`, which sync preserves, so the result will be consistent after sync.
- **[The device clock is wrong]** → Same exposure as today's dates. `CLOCK` stays injectable for tests.
- **[The 80 % threshold may feel too early or too late]** → It is one constant in `budget.ts` and easy to tune after real use.
- **[Income is counted only on payday, so the limit is low just before payday]** → Intended and conservative. It is noted in the proposal for review, and a forecast that includes upcoming income can come in `add-statistics`.
- **[Version 2 upgrade fails on a device]** → Adding a table is the safest Dexie upgrade. A spec opens a version-1 database with data and upgrades it.

## Migration Plan

Dexie upgrades the database on the first open. The only new store is empty until the user saves settings. Rollback to the previous build is not supported once a device has opened version 2, since Dexie refuses to open a newer database with an older schema. That's acceptable for a single-user app before release.
