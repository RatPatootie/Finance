# Proposal

## Why

The app records expenses but can't yet answer the main question: "how much can I spend today?" The home screen was built to show the balance and "left for today" (Monobank-style), and that space currently shows a placeholder ("Spent today").

## What Changes

Frontend only. No backend changes.

- **Settings screen** (new, opened from a gear icon on the home screen). The user enters:
  - **current balance**: how much money they have right now;
  - **monthly income**: the amount that arrives each month;
  - **payday**: the day of the month the income arrives (1–31, default 1).
  All three can be changed at any time. Amounts are typed on the same digit keypad as expenses, not in a plain input.
- **Balance tracking**: after the user sets a balance, the app subtracts each new expense and adds the monthly income on payday. Expenses dated before the balance was set don't count, because the entered balance already includes them. Editing or deleting a counted expense changes the balance straight away.
- **Daily limit**: free money / days left in the month, counting today. For now free money = balance; `add-frozen-amounts` will later subtract frozen money. The limit is worked out from the balance at the start of today, so spending during the day doesn't shrink it.
- **Left for today** = daily limit − spent today. It can be negative, shown as "over by X ₴".
- **Status colour** on "left for today":
  - green while spending is under 80 % of the limit;
  - yellow from 80 % up to the limit;
  - red once over the limit, or when there is no free money.
- **Home screen hero** (modifies the current home screen):
  - the balance as the big figure;
  - "left for today" smaller underneath, in its status colour;
  - today's list below as now.
  - Before any balance is set, the hero shows a "Set your balance" prompt that opens Settings.
- A new IndexedDB store holds the settings. It is a schema upgrade from version 1 to 2 and keeps existing expenses and categories.

Assumptions to check during review:

- Income is not counted before it arrives. Before payday, the limit spreads only the money the user already has across the rest of the month.
- A payday after the month's last day (for example 31 in February) falls on the last day of that month.

## Capabilities

### New Capabilities
- `budget-settings`: entering and changing the current balance, the monthly income and the payday on a Settings screen, stored offline.
- `daily-budget`: how the current balance, the daily limit, "left for today" and its status are worked out from the settings and the expenses.

### Modified Capabilities
- `expense-entry`: the "Home screen with an add button" requirement changes. The main figure becomes the balance with "left for today" (or a set-up prompt), instead of today's total. This requirement comes from `add-quick-expense-entry`, so that change must be archived first, which creates the main `expense-entry` spec.

## Impact

- **New files:**
  - `core/db/`: a settings model and repository, and FinanceDb `version(2)`.
  - `core/budget/`: pure calculation functions and a budget service with signals.
  - `features/settings/`: the Settings page, reusing the keypad and amount display in a sheet.
- **Changed files:**
  - `features/home/`: the hero, a gear button and the set-up prompt.
  - `app.routes.ts`: a lazy `/settings` route.
  - README feature list.
- **Bundle:** the Settings route is lazy, so the initial bundle stays under budget.
- **Offline:** everything is local, so the app keeps working offline.
