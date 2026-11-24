# Proposal

## Why

Categories are fixed to the five defaults. The user needs to add their own, rename them, and remove the ones they don't use, without losing past expenses. They also need "frozen" categories for money set aside, which `add-frozen-amounts` builds on.

## What Changes

Frontend only. No backend changes.

- A **Categories** section in Settings lists every category in order, with its type (Normal or Frozen).
- **Add:** a name and a type. The type is chosen once, at creation, and can't be changed later. A new category appears at the end of the entry screen's picker.
- **Rename:** existing expenses show the new name.
- **Remove:**
  - A category with no expenses is removed after a confirmation.
  - A category that has expenses opens a dialog that shows how many there are. The user moves them to another category of the same type, or by default to "Other", which is created when it doesn't exist. Then the category is removed.
- **Validation:** names are required, at most 24 characters, and unique regardless of case.
- **Data:** categories get a `type` field. Existing categories count as Normal, so no database upgrade is needed. Removed categories are soft-deleted for sync.
- In this change a Frozen category behaves like a Normal one, apart from its label. `add-frozen-amounts` adds the frozen behaviour.

## Capabilities

### New Capabilities
- `category-management`: adding, renaming and removing categories in Settings, the category type, and moving expenses when a category is removed.

### Modified Capabilities
None. `expense-categories` (from `add-quick-expense-entry`) already says that management belongs to Settings and that old expenses keep their category's name.

## Impact

- **New:** `features/settings/categories/` (section, add/rename sheet, remove dialog).
- **Changed:**
  - `CategoryRepository`: `add`, `rename`, `remove`, `countExpenses`, `ensureOther`;
  - `ExpenseRepository`: `moveCategory`;
  - `models.ts`: `CategoryType`.
- The category name is typed on the system keyboard. That's fine for a name, since the keypad is only for amounts.
- Works offline. The Settings route is lazy, so the initial bundle doesn't grow.
