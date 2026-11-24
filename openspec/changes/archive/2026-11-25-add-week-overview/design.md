# Design

## Context

- `computeBudget(settings, expenses, today)` gives today's figures from the balance anchor.
- `TodayList` renders rows with edit and delete, and `ExpenseRepository.forDate$` gives one day's records.
- The home page owns the edit sheet and the delete/undo flow.

## Goals / Non-Goals

**Goals:**
- A compact week strip that answers "how did each day go?" and opens any day.

**Non-Goals:**
- Month and calendar views.
- Charts.
- Statistics (that's `add-statistics`).

## Decisions

1. **The budget as of a day.**
   - `dayBudget(settings, expenses, day)` = `computeBudget(settings, expenses.filter(e => e.date <= day), day)`.
   - It returns null when `day < balanceDate` or no balance is set, which gives the neutral colour.
   - Today's figure is the same call, so the two can't disagree.
2. **Colour state** = `'none' | 'ok' | 'over' | 'unknown'`.
   - Spending equal to the limit counts as `'ok'`.
   - Days with only frozen records count as `'none'` once `add-frozen-amounts` exists.
3. **Data.**
   - One live query per shown week, `ExpenseRepository.between$(monday, sunday)`, for the squares and the chosen day.
   - The existing anchored stream (`BudgetService`, expenses since the balance day) for the limits.
   - The week strip computes the 7 states with a `computed`, which is cheap at a few hundred rows.
4. **Weeks.**
   - `startOfWeek(day)` (Monday) and `weekDays(monday)` work on Kyiv date keys with `addDays`, so DST can't affect them.
   - The label is built with `Intl` en-GB: "23–29 Nov", or "26 Oct – 1 Nov" across months.
5. **UI.**
   - A row of ‹ [7 squares] ›: 28 px arrows, squares filling the rest (they shrink to fit 375 px), with `aspect-ratio: 1` and a 12 px radius.
   - Square colours use the status tokens at a low tint (`color-mix` with the surface), with text in `on-surface`.
   - Today gets a 2 px primary ring; the chosen day gets an outline, so both show at once.
   - The strip is a day picker (`selected` input, `selectedChange` output). The home page owns the chosen day and feeds its main `TodayList` (new `heading` and `emptyText` inputs). The add button passes `?date=` for a past day, and the entry screen accepts only a past `YYYY-MM-DD`.
   - Arrows and squares are buttons with `aria-label`s ("Previous week", "Monday 23 November, over the limit").
6. **Files:** `week-strip.ts` / `.html` / `.scss`, following frontend/CLAUDE.md.

## Risks / Trade-offs

- [Past limits shift when old records are edited] → Expected: the colours always reflect the current data.
- [Long histories make the anchored stream bigger] → Only records since the balance day are loaded. Re-saving the balance trims it.
