# Design

## Context

- `Category` has `id`, `name`, `sortOrder`, `isHidden`, `isDeleted` and `updatedAt`.
- `CategoryRepository.byId` already finds deleted categories, so old expenses keep their name.
- Settings is a lazy route with a list-row style and keypad sheets.

## Goals / Non-Goals

**Goals:**
- Add, rename and remove categories, with a safe move of expenses on remove.

**Non-Goals:**
- Reordering and hiding without removing.
- Category colours or icons.
- Frozen behaviour (that's `add-frozen-amounts`).

## Decisions

1. **Type field without a schema bump.**
   - `type: 'normal' | 'frozen'` is optional on `Category`, and a missing value means normal (`categoryType(c)` helper).
   - It isn't indexed, so Dexie needs no new version.
2. **Remove = move, then soft delete, in one transaction.**
   - `ExpenseRepository.moveCategory(fromId, toId)` updates `categoryId` and `updatedAt` on every expense of `fromId`, including deleted ones, so undo and sync stay consistent.
   - The category is then marked `isDeleted = 1`.
   - All of it runs in one `rw` transaction over both tables, so a failure leaves nothing half-done.
3. **"Other" on demand.**
   - `ensureOther()` returns the existing non-deleted Normal category named "Other" (ignoring case), or creates one at the end.
   - It is created only when the user confirms a move to it.
4. **Validation in the repository.** `add` and `rename` trim the name, check its length and look for duplicates (ignoring case) among non-deleted categories, and reject with a typed error that the UI shows as a message.
5. **UI.**
   - Settings gets a "Categories" list (name and a small type tag) and an "Add category" row.
   - Tapping a row opens a bottom sheet with a name field (a native text input, `maxlength=24`), the type shown read-only, and Rename, Remove and Cancel.
   - Adding opens the same sheet, with a Normal/Frozen segmented choice.
   - Remove opens a dialog with the expense count and a target picker (same type, Other first and selected by default).
   - Following frontend/CLAUDE.md, each component keeps its template and styles in separate files.
6. **Sort order.** A new category gets `max(sortOrder) + 1`.

## Risks / Trade-offs

- [A move touches many rows] → A few hundred at most, done in one transaction; IndexedDB handles that instantly.
- [A name collides with a deleted category] → Allowed. Only non-deleted names must be unique, so removing then re-adding "Fun" works.
- [Sync later sees a moved expense and a deleted category] → Both carry new timestamps, and last write wins.
