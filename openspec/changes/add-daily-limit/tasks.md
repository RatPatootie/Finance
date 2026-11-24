# Tasks

All work is in `frontend/`. Run commands from that folder. `add-quick-expense-entry` must be reviewed and archived before this change is archived, because this change modifies its home screen requirement.

## 1. Settings storage

- [x] 1.1 Add a `BudgetSettings` model (with doc comments on `balanceDate` vs `balanceSetAt`) and `FinanceDb.version(2)` with `settings: 'id'`; verify a spec that opens a version-1 database containing expenses and categories, upgrades it, and finds the old rows plus an empty `settings` table
- [x] 1.2 Implement `SettingsRepository`:
  - a live `settings` signal that returns defaults (no balance, income 0, payday 1) when there is no row;
  - `setBalance(kopecks)`, which stores the amount, `balanceSetAt` = now and `balanceDate` = the Kyiv day;
  - `setMonthlyIncome(kopecks)` and `setPayday(day)`, which validate 0+ kopecks and 1вЂ“31.

  Each write bumps `updatedAt`. Verify a spec for the defaults, each setter, the validation, and the values surviving a new repository instance.

## 2. Budget calculation

- [x] 2.1 Implement `daysLeftInMonth` and `paydaysBetween` in `core/budget/budget.ts`. Verify a spec for 30 Nov в†’ 1, 24 Nov в†’ 7, 1 Dec в†’ 31, 28 Feb 2027 в†’ 1, 29 Feb 2028 в†’ 1, a payday on the anchor day not counted, payday 25 counted on the 25th, payday 31 counted on 28 Feb 2027 and on 30 Nov, and two paydays across a month boundary.
- [x] 2.2 Implement `isCounted` and `computeBudget`.
  - **Rounding and status:** floor division for the limit, and the status from integer math (`spent * 5 >= limit * 4`).
  - **Spec coverage:** every scenario in specs/daily-budget, including:
    - an expense on the anchor day before and after `balanceSetAt`;
    - backdated expenses before and after the anchor day;
    - deleted expenses being ignored;
    - a limit of 1 714,28 for 12 000 with 7 days left;
    - the limit unchanged after spending today;
    - negative free money в†’ limit 0 and red;
    - the 799,99 / 800 / 1 000 / 1 000,01 status boundaries;
    - limit 0 with spent 0 в†’ red;
    - `null` when no balance is set.
- [x] 2.3 Add `BudgetService`, which combines the settings, a live query of expenses since `balanceDate`, and `TodayService.today` into a `budget` signal. Verify a spec with a fake clock that the signal updates after an add, edit, delete and restore, after a balance re-save, and at Kyiv midnight, including income arriving on payday.

## 3. Settings screen

- [x] 3.1 Add the lazy `/settings` route and the `features/settings/settings.page`, with a back control and rows for Balance (or "Not set"), Monthly income and Payday. Verify a spec for the rows' text with and without settings, and that back navigates to `/`.
- [x] 3.2 Add the amount sheet (`AmountDisplay` + `Keypad` + Save/Cancel, prefilled with the current value) for Balance and Monthly income. Verify specs for the "Set the balance" and "Cancel keeps the old value" scenarios, saving 0 as income, and that no text input is rendered.
- [x] 3.3 Add the payday sheet (a grid of days 1вЂ“31, where a tap saves). Verify a spec for the default 1 and for picking 25.

## 4. Home screen

- [x] 4.1 Replace the hero with the balance, the "Left today вЂ¦ В· of вЂ¦" or "Over by вЂ¦" line and the status colour.
  - **Colour tokens:** add green, amber and red status tokens for light and dark in `styles.scss`, with at least 4.5:1 text contrast in both.
  - **Spec coverage:** the "Balance and left for today", "Over by" and "Figures update after a save" scenarios, plus the status class for green, yellow and red.
- [x] 4.2 Show the "Set your balance" card when no balance is set, and add the gear button to the top-right corner. Both navigate to `/settings`. Verify a spec for the card, for each navigation, and that the add button still opens `/add`.

## 5. Integration checks

- [x] 5.1 Run `npm test -- --watch=false` and `npm run build`. Verify both pass with no new warnings and the initial bundle stays under 500 kB.
- [x] 5.2 In a production build at 375Г—812, in light and dark, set the balance, income and payday, add an expense, edit it and delete it. Verify the hero updates each time. Then go offline, reload, and verify that the settings and figures are unchanged.
- [x] 5.3 Update the README feature list (daily limit done) and verify that the run steps written there still work.

## Workflow follow-up

- Review the uncommitted changes with the user before committing.
- Archive `add-quick-expense-entry` first, then archive this change with `/opsx:archive`.
- Next change: `add-frozen-amounts`, which subtracts frozen money from free money in `computeBudget`.
