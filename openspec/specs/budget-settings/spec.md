# budget-settings Specification

## Purpose

Lets the user tell the app how much money they have, how much income arrives each month and on which day, and change these at any time, fully offline.

## Requirements

### Requirement: Settings screen
The app SHALL have a Settings screen opened from a settings control on the home screen. It SHALL show the current balance, the monthly income and the payday, and SHALL have a control that returns to the home screen. It SHALL NOT offer category management in this change.

#### Scenario: Open settings from home
- **GIVEN** the home screen is shown
- **WHEN** the user taps the settings control
- **THEN** the Settings screen shows the balance, monthly income and payday

#### Scenario: Back to home
- **GIVEN** the Settings screen is shown
- **WHEN** the user taps back
- **THEN** the home screen is shown

### Requirement: Entering an amount setting with the keypad
The balance and the monthly income SHALL be entered with the same digit keypad as expenses, never with the system keyboard, prefilled with the current value. Both SHALL be stored as whole kopecks, zero or more. Saving SHALL take effect at once; cancelling SHALL leave the stored value unchanged.

#### Scenario: Set the balance
- **GIVEN** no balance is set
- **WHEN** the user opens the balance, types 1, 2, 0, 0, 0 and saves
- **THEN** the balance is stored as 1200000 kopecks
- **AND** the Settings screen shows "12 000,00 ₴"

#### Scenario: Cancel keeps the old value
- **GIVEN** the monthly income is 3000000 kopecks
- **WHEN** the user opens the income, types a new amount and cancels
- **THEN** the monthly income stays 3000000 kopecks

#### Scenario: Zero income is allowed
- **WHEN** the user saves a monthly income of "0"
- **THEN** the monthly income is stored as 0

### Requirement: Calculator keys for amount settings
The balance and income keypad SHALL also have + − × ÷ keys and an = key, so the user can add up amounts (for example two cards). × and ÷ SHALL apply before + and −, and the result SHALL be rounded to whole kopecks. A pending result SHALL be shown under the expression. Saving SHALL store the result. Division by zero and a result below zero or above 9 999 999,99 ₴ SHALL show an error and SHALL NOT save. The expense entry keypad SHALL NOT change.

#### Scenario: Add two amounts
- **WHEN** the user types 8, 0, 0, 0, +, 4, 5, 0, 0 and taps =
- **THEN** the amount shows "12500"

#### Scenario: Save uses the result without tapping =
- **WHEN** the user types 1, 0, 0, 0, 0, +, 2, 0, 0, 0 and saves
- **THEN** 1200000 kopecks is stored

#### Scenario: Multiplication before addition
- **WHEN** the user types 1, 0, 0, +, 5, 0, ×, 2 and taps =
- **THEN** the amount shows "200"

#### Scenario: Division rounds to kopecks
- **WHEN** the user types 1, 0, 0, ÷, 3 and taps =
- **THEN** the amount shows "33.33"

#### Scenario: A second operator replaces the first
- **GIVEN** the expression is "100+"
- **WHEN** the user taps −
- **THEN** the expression is "100−"

#### Scenario: Division by zero
- **WHEN** the user types 1, 0, 0, ÷, 0
- **THEN** an error is shown and Save does nothing

#### Scenario: Negative result
- **WHEN** the user types 1, 0, −, 5, 0
- **THEN** an error is shown and Save does nothing

### Requirement: Choosing the payday
The user SHALL choose the payday as a day of the month from 1 to 31. Before any choice the payday SHALL be 1.

#### Scenario: Default payday
- **GIVEN** the user has never chosen a payday
- **WHEN** the Settings screen opens
- **THEN** the payday shows 1

#### Scenario: Change the payday
- **WHEN** the user picks 25 as the payday
- **THEN** the payday is stored as 25

### Requirement: Re-entering the balance re-anchors it
Saving a balance SHALL record it as the user's balance at that moment. From then on the app SHALL count only expenses and income that come after it, as defined in the daily-budget capability.

#### Scenario: Correcting the balance to match the bank
- **GIVEN** the app shows a balance of 9 500,00 ₴
- **WHEN** the user saves a balance of 9 320,00 ₴
- **THEN** the home screen shows a balance of 9 320,00 ₴

### Requirement: Settings are stored offline and survive upgrades
Settings SHALL be stored on the device and SHALL survive reloads and working without a network. Upgrading from the previous version of the app SHALL keep all existing expenses and categories.

#### Scenario: Survives a reload offline
- **GIVEN** the balance and income are saved and the network is off
- **WHEN** the app is reloaded
- **THEN** the same balance, income and payday are shown

#### Scenario: Upgrade keeps old data
- **GIVEN** a device with expenses stored by the previous version
- **WHEN** the new version opens for the first time
- **THEN** all those expenses and categories are still there and no balance is set
