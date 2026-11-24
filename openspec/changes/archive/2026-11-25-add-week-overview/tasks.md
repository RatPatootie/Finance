# Tasks

All work is in `frontend/`. Follow `frontend/CLAUDE.md`.

## 1. Logic

- [x] 1.1 Add `startOfWeek`, `weekDays` and `formatWeekLabel` in `core/date`. Verify specs for a Monday and a Sunday, a week across months ("26 Oct – 1 Nov") and across years, and a DST week.
- [x] 1.2 Add `dayBudget` and `dayState` (`none` / `ok` / `over` / `unknown`) in `core/budget`. Verify specs for every "Day colours" scenario, the limit of 1 714,28 on the balance day, spending equal to the limit as `ok`, and records after the day being ignored.
- [x] 1.3 Add `ExpenseRepository.between$(from, to)`, a live list of non-deleted records in the date range. Verify a spec.

## 2. Week strip

- [x] 2.1 Build `features/home/week-strip` with arrows, the label, 7 squares with state classes, a ring on today, and future days disabled. Verify component specs for the current week on open, previous/next, next disabled on the current week, the label across months, and future days not being selectable.
- [x] 2.2 Make the strip a day picker that drives the home page's main list (`TodayList` gets `heading` and `emptyText`), and make the add button open the entry screen on a chosen past day (`?date=`). Verify specs for each "The chosen day fills the main list" scenario, for future days not being selectable, and for the entry screen ignoring a future or malformed date.
- [x] 2.3 Place the strip under today's list on the home page. Verify a home spec that it renders and that a save today recolours today's square.

## 3. Integration checks

- [x] 3.1 Run `npm test -- --watch=false` and `npm run build`. Verify both pass with no new warnings.
- [x] 3.2 In a production build at 375×812, in light and dark, step through weeks and open days. Verify the colours against the data, that it fits without horizontal scroll, and that it works offline.
- [x] 3.3 Update the README feature list and verify that it matches the app.

## Workflow follow-up

- Review with the user before committing.
