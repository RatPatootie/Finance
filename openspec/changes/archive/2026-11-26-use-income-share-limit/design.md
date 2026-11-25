# Design

## Context

- `computeBudget(settings, expenses, today, frozen)` derives the balance from the anchor and the limit from free money ÷ days left.
- `dayBudget` reuses it for past days.
- `BudgetService` feeds it expenses since the balance day, plus the frozen records.
- `HomePage` shows the hero, the add button, the day list, then the week strip.

## Goals / Non-Goals

**Goals:**
- An income-based limit with one setting.
- A balance that never includes frozen money.
- The new order on the home screen.

**Non-Goals:**
- A history of income or share changes: past days use the current values.
- Rolling unspent money over to the next day.
- Changes to "Return" (kept as is).

## Decisions

1. **The limit is separate from the balance.**
   - `dailyLimit(income, sharePercent, day)` = `Math.floor(income * sharePercent / (100 * daysInMonth(day)))`, all in integer kopecks.
   - `daysInMonth` already exists in `budget.ts` and works on Kyiv date keys, so the month length is always right (28–31).
2. **Today's spending is no longer anchored.** `spentOn(day, records, frozenIds)` adds up the non-deleted, non-frozen records dated `day`. The balance keeps the anchor rule (`isCounted`). Only "left today" and the colours use `spentOn`.
3. **The budget result type.**
   - `computeBudget` returns `{ balance, frozen, limit: number | null, spentToday, left: number | null, status: BudgetStatus | null }`; `limit` and `status` are null when no share is set.
   - It still returns null when no balance is set, which drives the balance prompt.
   - A separate `limitFor(day)` in `BudgetService` serves the week strip, so the colours work even before a balance is set.
4. **Data for today's spending.** `BudgetService` adds a live `forDate$(today)` query, so spending recorded before the balance anchor still counts.
5. **Settings.**
   - `BudgetSettings.dailySharePercent?: number`, with `setDailyShare(n)` validating a whole number from 1 to 100.
   - The Settings row opens a small percent sheet: the keypad without operators, max 3 digits, and an error outside 1–100.
   - The "Show frozen" row is removed. `setShowFrozen` and the stored field stay, untouched and unread.
6. **Shown balance:** `balance − frozen`, always.
7. **Home order:** hero → add button → week strip → day list. The day list moves below the strip, and the "Set your daily share" prompt replaces the left-today line when the share is missing.

## Risks / Trade-offs

- [Current users see a "set your daily share" prompt instead of a limit after the update] → Intended and agreed: nothing is guessed for them.
- [Past-day colours change when the income or share changes] → Accepted. There's no history of these settings, and it's noted in the spec.

## Migration Plan

- **No Dexie version change:** `dailySharePercent` is an optional field on the existing settings row.
- **Old rows:** a missing `dailySharePercent` reads as "not set"; `showFrozen` is left in place and ignored.
- **Records:** no expense, freeze, return or category is rewritten or deleted.
- **Older cached build:** it ignores the unknown field and keeps working until the service worker updates.
- **Test:** a spec writes a settings row and records in the previous version's shape (without the new field) and checks that the balance, income, payday and records read back unchanged, with the share "not set".
