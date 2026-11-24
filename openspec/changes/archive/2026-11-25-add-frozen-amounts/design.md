# Design

## Context

- `computeBudget(settings, expenses, today)` derives the balance from an anchor and counts every non-deleted expense after it.
- `add-category-management` adds `Category.type`.
- The home hero shows the balance, plus "left today" in a status colour.

## Goals / Non-Goals

**Goals:**
- Freezes and returns as ordinary records, so edit, delete, undo and sync keep working.

**Non-Goals:**
- Freeze targets or goals.
- Interest.
- Moving frozen money between Frozen categories.

## Decisions

1. **Records, not a separate table.**
   - A record in a Frozen category is a freeze; one with `kind: 'return'` is a return.
   - This reuses `ExpenseRepository`, the lists, edit/delete/undo and future sync.
   - *Alternative:* a separate `frozen` table. Rejected: it would duplicate all of that.
2. **The budget needs category types.**
   - `computeBudget` takes a `frozenIds: ReadonlySet<string>`.
   - Expenses in those categories are left out of the counted spending.
   - `frozenTotal(expenses, frozenIds, day)` adds up freezes minus returns that are not deleted and dated on or before `day`.
   - `free = balance − frozenTotal`, and `freeAtStartOfDay = balance + spentToday − frozenTotal`.
   - The current frozen total is used, so freezing today lowers today's limit at once. That is intended, since the money is no longer available.
3. **Frozen money isn't tied to the balance anchor.**
   - Freezes count whatever their date, including before the balance was set, because the frozen pot is the user's own number.
   - *Alternative:* anchor them like expenses. Rejected: a freeze made before setting the balance would disappear from the pot.
4. **Toggle display only.**
   - `showFrozen` lives in `BudgetSettings`.
   - The hero shows `balance − frozenTotal` when it's on and `balance` when it's off.
   - Lists filter out frozen-category records when it's off.
   - The budget figures don't depend on it.
5. **Return sheet.** The Settings amount sheet is reused with a maximum (the frozen total). Over the maximum it shows "More than is frozen" and blocks Save. Saving creates a `kind: 'return'` record dated today.
6. **Marking.**
   - The today list shows freezes with a snowflake and "Frozen", and returns as "Returned" with a minus sign.
   - The category grid adds a small inline SVG snowflake to Frozen buttons.

## Risks / Trade-offs

- [A frozen total below 0 after editing old records] → `frozenTotal` per category is clamped at 0 for display. The budget uses the clamped values too.
- [The meaning of the toggle may differ from what the user meant] → Noted in the proposal for review. It only affects display, so changing it later is cheap.
