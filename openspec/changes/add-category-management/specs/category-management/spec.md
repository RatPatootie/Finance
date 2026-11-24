# Spec Delta

## Purpose

Lets the user shape their own list of categories in Settings, adding, renaming and removing them, without losing or orphaning past expenses.

## ADDED Requirements

### Requirement: Categories section in Settings
Settings SHALL list every category that is not deleted, in sort order, each with its name and its type (Normal or Frozen), and SHALL offer controls to add, rename and remove categories.

#### Scenario: Defaults are listed
- **GIVEN** only the five default categories exist
- **WHEN** the user opens Settings
- **THEN** the Categories section lists Food, Transport, Health, Shopping and Fun, each marked Normal

### Requirement: Adding a category
The user SHALL add a category by entering a name and choosing its type, Normal or Frozen. The new category SHALL be placed after all existing ones and SHALL appear on the entry screen.

#### Scenario: Add a normal category
- **WHEN** the user adds "Coffee" with the type Normal
- **THEN** "Coffee" is listed last in Settings
- **AND** the entry screen shows a "Coffee" button after the others

#### Scenario: Add a frozen category
- **WHEN** the user adds "Vacation" with the type Frozen
- **THEN** "Vacation" is listed and marked Frozen

### Requirement: Category names are valid and unique
A category name SHALL be trimmed, SHALL NOT be empty, SHALL be at most 24 characters, and SHALL NOT match the name of another category that is not deleted, ignoring case. An invalid name SHALL show a message and SHALL NOT be saved.

#### Scenario: Duplicate name
- **GIVEN** a category "Food" exists
- **WHEN** the user tries to add " food "
- **THEN** a message says the name is already used and nothing is saved

#### Scenario: Empty name
- **WHEN** the user tries to save a name made of spaces
- **THEN** a message asks for a name and nothing is saved

### Requirement: Type is fixed after creation
A category's type SHALL be chosen when it is added and SHALL NOT be changed afterwards.

#### Scenario: No type change on rename
- **GIVEN** the Normal category "Food"
- **WHEN** the user opens it to rename it
- **THEN** its type is shown but cannot be changed

### Requirement: Renaming a category
The user SHALL rename a category with the same name rules. Expenses in that category SHALL show the new name.

#### Scenario: Rename keeps expenses
- **GIVEN** today's list shows an expense in "Fun"
- **WHEN** the user renames "Fun" to "Going out"
- **THEN** today's list shows that expense in "Going out"

### Requirement: Removing a category without expenses
Removing a category that has no expenses SHALL ask for confirmation and then remove it from Settings and from the entry screen.

#### Scenario: Remove an unused category
- **GIVEN** "Coffee" has no expenses
- **WHEN** the user removes it and confirms
- **THEN** "Coffee" is no longer listed in Settings or on the entry screen

### Requirement: Removing a category with expenses moves them
Removing a category that has expenses (deleted ones included) SHALL show how many it has and SHALL let the user pick another category of the same type to move them to. The default target SHALL be "Other", created as a Normal category when it doesn't exist. On confirmation, every expense SHALL be moved to the target, then the category SHALL be removed. Cancelling SHALL change nothing.

#### Scenario: Move to Other by default
- **GIVEN** "Fun" has 12 expenses and no "Other" category exists
- **WHEN** the user removes "Fun" and confirms without changing the target
- **THEN** a Normal category "Other" exists
- **AND** all 12 expenses belong to "Other" and "Fun" is gone

#### Scenario: Move to a chosen category
- **GIVEN** "Fun" has 3 expenses
- **WHEN** the user removes "Fun", picks "Shopping" and confirms
- **THEN** the 3 expenses belong to "Shopping"

#### Scenario: Only categories of the same type are offered
- **GIVEN** the Frozen category "Vacation" has expenses
- **WHEN** the user removes it
- **THEN** only other Frozen categories are offered as the target
- **AND** when there is none, the user is told to add one first and nothing is removed

#### Scenario: Cancel keeps everything
- **GIVEN** "Fun" has 3 expenses
- **WHEN** the user starts removing "Fun" and cancels
- **THEN** "Fun" and its 3 expenses are unchanged

#### Scenario: Removing Other itself
- **GIVEN** "Other" has expenses
- **WHEN** the user removes "Other"
- **THEN** "Other" is not offered as the target and the user must pick another category

### Requirement: Category changes are stored offline and synced later
Adding, renaming and removing SHALL work without a network. Removed categories SHALL be kept as deleted records, and moved expenses SHALL get a new updated-at timestamp, so the changes can be synced later.

#### Scenario: Removed category is kept as deleted
- **WHEN** a category is removed
- **THEN** its record still exists with deleted = true and a new updated-at timestamp
