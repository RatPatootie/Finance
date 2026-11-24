# Proposal

## Why

Some money isn't for daily spending: savings for a trip, a deposit, a debt to pay back. The user wants to set it aside in "frozen" categories so the daily limit ignores it, and move it back to the balance when it is free again.

## What Changes

Frontend only. Builds on `add-category-management` (the Frozen category type).

- **Freezing:** saving an amount under a Frozen category freezes it. It isn't spending: the balance doesn't drop, and today's spending and "left today" don't change. The money leaves the free money, so the daily limit drops.
- **Return to balance:** each Frozen category in Settings shows its frozen total and has a "Return" action. The amount is typed on the keypad and can't exceed what is frozen. The returned money becomes free again.
- **Free money** = balance − frozen total. The daily limit uses free money.
- **"Show frozen" toggle** in Settings (on by default):
  - **on:** frozen records appear in the lists, marked as frozen, and the home balance shows money without the frozen part (as if it were spent);
  - **off:** frozen records are hidden from the lists, and the home balance shows all money.
  - The daily limit is the same either way.
- **Entry screen:** Frozen categories come after the Normal ones, with a snowflake mark.

Assumption to check during review: "show frozen" means frozen records are visible and taken off the shown balance. With the toggle off they are hidden and the shown balance includes them.

## Capabilities

### New Capabilities
- `frozen-money`: freezing, returning, the frozen totals and the show-frozen toggle.

### Modified Capabilities
- `daily-budget`:
  - frozen records are not expenses;
  - free money at the start of the day excludes the frozen total.

  `add-daily-limit` must be archived first, so that the main `daily-budget` spec exists.

## Impact

- **Models:**
  - `Expense.kind?: 'return'` marks a return. A missing value means a freeze in a Frozen category, or a normal expense elsewhere.
  - `BudgetSettings.showFrozen` (default true).
  - No database upgrade is needed.
- **Code:**
  - `core/budget`: `frozenTotals`, `computeBudget` (free money);
  - `BudgetService` (needs category types);
  - home hero, today list, Settings (frozen rows, Return sheet, toggle);
  - category grid (the frozen mark).
