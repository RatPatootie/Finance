# Tasks

All work is in `frontend/`. Run commands from that folder. Follow `frontend/CLAUDE.md`.

## 1. Data

- [x] 1.1 Add `CategoryType` and the optional `type` on `Category`, plus a `categoryType()` helper that treats a missing value as normal. Verify a spec that seeded and old categories read as normal.
- [x] 1.2 Add `CategoryRepository.add(name, type)`, `rename(id, name)` and `ensureOther()`, with validation (trim, 1–24 chars, unique ignoring case among non-deleted). Verify specs for each scenario in "Category names are valid and unique", sort order at the end, and that a deleted name can be reused.
- [x] 1.3 Add `ExpenseRepository.moveCategory(fromId, toId)` and `CategoryRepository.remove(id, targetId?)`: move every expense (deleted ones included), then soft-delete the category, all in one transaction. A category with expenses can't be removed without a target, and the target must be the same type and not the category itself. Verify specs for the remove scenarios, including a forced failure that leaves the data unchanged.

## 2. Settings UI

- [x] 2.1 Add the Categories section to Settings (name and type tag per row, plus an "Add category" row). Verify a spec that the defaults are listed in order and marked Normal.
- [x] 2.2 Add the category sheet: a name field and a Normal/Frozen choice when adding; a name field, a read-only type, Rename and Remove when editing. Verify specs for add normal, add frozen, rename, the validation messages, and that the type can't be changed.
- [x] 2.3 Add the remove dialog:
  - **No expenses:** a confirmation.
  - **With expenses:** the count and a target picker with only same-type categories, "Other" first by default and left out when "Other" is the one being removed; a message when no target is possible.

  Verify specs for each remove scenario and for cancelling.
- [x] 2.4 Check that the entry screen shows added and renamed categories, and no longer shows removed ones. Verify an entry page spec.

## 3. Integration checks

- [x] 3.1 Run `npm test -- --watch=false` and `npm run build`. Verify both pass with no new warnings.
- [x] 3.2 In a production build at 375×812, in light and dark, add, rename and remove categories, including removing one with expenses into "Other". Verify today's list shows the right names, offline included.
- [x] 3.3 Update the README feature list and verify that it matches the app.

## Workflow follow-up

- Review with the user before committing.
- Archive `add-quick-expense-entry` and `add-daily-limit` before this change.
