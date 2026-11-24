# Proposal

## Why

The home screen only shows today. The user wants to see the whole week at a glance (which days had spending and which went over the limit), open any day's records, and step back through earlier weeks.

## What Changes

Frontend only.

- **Week strip on the home screen**, below today's list: 7 squares, Monday to Sunday, with ‹ and › arrows on the left and right to switch weeks, and the week's dates as a label.
- **Each square shows** the weekday and the day number, coloured by state:
  - no records: plain;
  - records within that day's limit: green;
  - over that day's limit: red;
  - records on a day with no known limit (before the balance was set): neutral.

  Today has a ring. Future days are dimmed and can't be tapped. The › arrow is disabled on the current week.
- **Tapping a day** switches the main list (between the add button and the strip) to that day: its records, total, edit and delete. The add button then opens the entry screen on that day. Tapping today goes back to today.
- **A past day's limit** comes from the same rule as today's: money at the start of that day ÷ days left in its month.

## Capabilities

### New Capabilities
- `week-overview`: the week strip, its colours, switching weeks and the records of a chosen day.

### Modified Capabilities
None.

## Impact

- **New:** `features/home/week-strip` (component and files), `core/date` week helpers (`startOfWeek`, `weekDays`).
- **New in `core/budget`:** `dayBudget(settings, expenses, day)`, the budget as of a given day.
- **New in `ExpenseRepository`:** `between$(from, to)`.
- **Changed:** `TodayList` gets a heading input, so it can be reused for a chosen day.
- If `add-frozen-amounts` is in place, frozen records are not spending here either, through the same budget functions.
- The strip lives in the lazy home chunk, so the initial bundle doesn't grow.
