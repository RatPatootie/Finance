# expense-categories Specification

## Purpose

Defines the categories an expense can belong to: the default set created on first launch, what a category consists of, and which categories the entry screen offers.

## Requirements

### Requirement: Default categories are seeded once
On first launch, when the device has no categories, the system SHALL create five categories in this order: Food, Transport, Health, Shopping, Fun. It SHALL NOT seed them again once any category exists.

#### Scenario: First launch on a new device
- **GIVEN** the local database has no categories
- **WHEN** the app starts
- **THEN** the categories Food, Transport, Health, Shopping and Fun exist, in that order

#### Scenario: Later launches do not duplicate defaults
- **GIVEN** the default categories were already created
- **WHEN** the app starts again
- **THEN** exactly one category with each default name exists

#### Scenario: Seeding works offline
- **GIVEN** the device has no network connection and no categories
- **WHEN** the app starts
- **THEN** the five default categories are created

### Requirement: Category record
Each category SHALL have a stable client-generated unique id, a display name, a sort order, a hidden flag, an updated-at timestamp and a deleted flag, so it can be synced and managed in Settings later.

#### Scenario: Seeded category has sync fields
- **WHEN** the default categories are created
- **THEN** each one has a unique id, hidden = false, deleted = false and an updated-at timestamp

### Requirement: Entry picker shows active categories only
The entry screen SHALL show every category that is not hidden and not deleted, in sort order. It SHALL NOT offer any control to create, rename or delete a category; those actions belong to Settings.

#### Scenario: Picker lists defaults in order
- **GIVEN** only the default categories exist
- **WHEN** the entry screen opens
- **THEN** it shows the buttons Food, Transport, Health, Shopping, Fun in that order

#### Scenario: Hidden category is not offered
- **GIVEN** the category "Fun" is marked hidden
- **WHEN** the entry screen opens
- **THEN** no "Fun" button is shown

#### Scenario: No add-category control on the entry screen
- **WHEN** the entry screen is shown
- **THEN** it has no control to add, rename or delete categories

### Requirement: Existing expenses keep their category name
An expense whose category is later hidden or deleted SHALL still show that category's name in lists.

#### Scenario: Expense of a hidden category
- **GIVEN** an expense recorded under "Fun"
- **AND** "Fun" is later marked hidden
- **WHEN** today's list is shown
- **THEN** the expense still shows the category "Fun"
