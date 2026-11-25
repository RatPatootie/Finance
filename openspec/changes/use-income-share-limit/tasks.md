# Tasks

All work is in `frontend/`. Follow `frontend/CLAUDE.md`, including "User data".

## 1. Calculation and settings

- [x] 1.1 Add `BudgetSettings.dailySharePercent?` and `SettingsRepository.setDailyShare` (whole 1–100). Verify specs for saving, rejecting 0, 101 and 2.5, and for an old settings row without the field reading as not set while balance, income and payday stay unchanged.
- [x] 1.2 Add `dailyLimit(income, share, day)` and `spentOn(day, records, frozenIds)`, and change `computeBudget` so the limit and status come from income × share ÷ days in the month, and "left" uses today's spending. Verify specs for every scenario in the `daily-budget` delta: 400,00 in November, 387,09 in December, 428,57 in February, no share → no limit, income 0 → 0 and red, the balance and frozen money not affecting the limit, spending recorded before the balance anchor counting, a freeze not counting, and the 80 % / over status boundaries.
- [x] 1.3 Update `BudgetService` (today's records, `limitFor(day)`) and `dayBudget`/`dayState` for the week colours (neutral when no share is set). Verify service and budget specs, including live updates after a share change.

## 2. UI

- [x] 2.1 Settings: add the "Daily share of income" row and a percent sheet, and remove the "Show frozen" row. Verify specs for setting 40 %, the range error, and that the switch is gone.
- [x] 2.2 Home:
  - order: hero, add button, week strip, day list;
  - the shown balance is always the balance minus frozen money;
  - frozen records always listed;
  - the "Set your daily share" prompt when the share is missing.

  Verify home specs for the order, "250,00 ₴ left today", "120,00 ₴ over today", the share prompt, and a freeze being listed and taken off the shown balance on today and on a past day.
- [x] 2.3 Week strip: colours from the new limit, and neutral with no share. Verify the week-strip spec scenarios.

- [x] 2.4 Add today's budget bar under the left-today line (fill = spent ÷ limit, capped at full, in the status colour; `role=progressbar`; text "X of Y ₴ used"). Verify home specs for each "Today's budget bar" scenario.

## 3. Integration checks

- [x] 3.1 Run `npm test -- --watch=false` and `npm run build`. Verify both pass with no new warnings.
- [x] 3.2 In a production build at 375×812, with a database written by the previous version (balance, income, freezes and returns set), open the new version. Verify nothing is lost and the share prompt shows; then set 40 % and check the hero, the colours and the order in light and dark, offline included.
- [x] 3.3 Update the README ("How the numbers are worked out" and the features) and verify that it matches the app.

## Workflow follow-up

- Review with the user before committing.
- Archive the change after review.
