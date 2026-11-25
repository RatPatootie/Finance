# Proposal

## Why

The daily limit currently comes from the balance spread over the rest of the month. The user wants it to come from income instead: a chosen share of the monthly income, split over the days of the month. Frozen money should always be visible as records but never counted in the shown balance. The week strip should sit above the day's list.

## What Changes

Frontend only. Touches stored user data: one new optional settings field. No schema change and nothing deleted.

- **New daily limit** = monthly income × x % ÷ number of days in the current month (28–31, worked out from the Kyiv date), rounded down to kopecks.
  - x is a whole percent from 1 to 100, set in Settings ("Daily share of income").
  - The balance and frozen money no longer affect the limit.
- **Before x is set** (new users and current users after the update), the home screen shows a prompt to set the daily share instead of the "left today" line. No limit is guessed.
- **"Left today"** = the limit − today's spending, where today's spending is every expense dated today outside Frozen categories. It no longer depends on when the balance was set.
- **Frozen money:**
  - frozen records are always listed (the "Show frozen" switch is removed);
  - the shown balance is always the balance minus the frozen total;
  - "Return" stays as it is.
- **Home layout:** balance, then the add button, then the week strip, then the chosen day's list.
- **Week colours** use the same new limit for every day. "Neutral" now means that no daily share is set.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `daily-budget`: the "Daily limit", "Left for today" and "Spending status" rules.
- `budget-settings`: a new "Daily share of income" setting.
- `frozen-money`:
  - remove "Show frozen toggle";
  - frozen records are always listed and always out of the shown balance.
- `expense-entry`: the home screen order, and a prompt when no daily share is set.
- `week-overview`: the strip's position, the neutral colour and the past-day limit rule.

## Impact

- **Changed code:**
  - `core/budget/budget.ts` (`computeBudget`, `dayBudget`);
  - `BudgetSettings.dailySharePercent?` and `SettingsRepository.setDailyShare`;
  - Settings (a percent row and sheet, the switch removed);
  - the home page (order, prompt, shown balance, lists);
  - `week-strip`;
  - specs.
- **User data:**
  - existing settings rows lack `dailySharePercent` and read as "not set";
  - the stored `showFrozen` value is left in place and ignored;
  - expenses, freezes and returns are unchanged.
