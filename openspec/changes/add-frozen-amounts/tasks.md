# Tasks

All work is in `frontend/`. Requires `add-category-management`. Follow `frontend/CLAUDE.md`.

## 1. Calculation

- [x] 1.1 Add `Expense.kind?: 'return'`, `BudgetSettings.showFrozen` (default true) and `frozenTotals(expenses, frozenIds, day)` (per category and overall, clamped at 0). Verify specs for freeze/freeze/return = 1 800, deleted freezes ignored, and records after `day` ignored.
- [x] 1.2 Change `computeBudget` to take `frozenIds`: frozen records aren't spending, and free money is the balance minus the frozen total. Verify specs for every scenario in the `daily-budget` delta (1 428,57 with 2 000 frozen, 1 714,28 after returning it, the balance unchanged by a freeze) and that all earlier budget specs still pass.
- [x] 1.3 Feed `frozenIds` and the frozen total from the categories into `BudgetService`. Verify a service spec that a freeze, a return and deleting a freeze update the figures live.

## 2. UI

- [x] 2.1 Show Frozen categories after the Normal ones with a snowflake on the entry screen, and make saving under them a freeze. Verify entry page specs for the order, the mark, and today's spending staying unchanged.
- [x] 2.2 In Settings, list Frozen categories with their totals and a Return action (the amount sheet with a maximum). Verify specs for a partial return and for blocking a return over the total.
- [x] 2.3 Add the "Show frozen" switch. The home balance and the lists follow it, and the limit doesn't. Verify home specs for the "Toggle on" and "Toggle off" scenarios.
- [x] 2.4 Mark freezes ("Frozen" with a snowflake) and returns ("Returned") in the lists, leaving both out of the day total. Verify a today-list spec.

## 3. Integration checks

- [x] 3.1 Run `npm test -- --watch=false` and `npm run build`. Verify both pass with no new warnings.
- [x] 3.2 In a production build at 375×812, in light and dark, freeze, return and toggle. Verify the hero, limit and lists each time, offline included.
- [x] 3.3 Update the README feature list and verify that it matches the app.

## Workflow follow-up

- Review with the user before committing.
- Archive `add-daily-limit` and `add-category-management` before this change.
