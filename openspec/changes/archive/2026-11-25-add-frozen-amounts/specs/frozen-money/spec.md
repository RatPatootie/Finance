# Spec Delta

## Purpose

Lets the user set money aside in frozen categories so the daily limit ignores it, and move it back to the free money later.

## ADDED Requirements

### Requirement: Saving under a Frozen category freezes money
Saving an amount under a Frozen category SHALL record it as frozen money for that category. It SHALL NOT count as spending: today's spending, the day total and "left today" SHALL NOT change.

#### Scenario: Freeze 2 000
- **GIVEN** 300,00 ₴ was spent today
- **WHEN** the user enters 2000 and taps the Frozen category "Vacation"
- **THEN** "Vacation" holds 2 000,00 ₴ frozen
- **AND** today's spending is still 300,00 ₴

### Requirement: Frozen totals
The frozen total of a category SHALL be its freezes minus its returns, ignoring deleted records. The overall frozen total SHALL be the sum over all Frozen categories, and SHALL only count records dated on or before the day being worked out.

#### Scenario: Freeze, freeze, return
- **GIVEN** "Vacation" has freezes of 2 000,00 ₴ and 500,00 ₴ and a return of 700,00 ₴
- **WHEN** the frozen total is shown
- **THEN** "Vacation" holds 1 800,00 ₴

#### Scenario: Deleting a freeze
- **GIVEN** "Vacation" holds 2 000,00 ₴ from one freeze
- **WHEN** that freeze is deleted
- **THEN** "Vacation" holds 0,00 ₴

### Requirement: Returning frozen money to the balance
Settings SHALL show each Frozen category with its frozen total and a Return action. Return SHALL take an amount on the keypad, from more than 0 up to the category's frozen total, and SHALL record it as a return dated today. A larger amount SHALL show an error and SHALL NOT be saved.

#### Scenario: Return part of the money
- **GIVEN** "Vacation" holds 2 000,00 ₴
- **WHEN** the user returns 500,00 ₴
- **THEN** "Vacation" holds 1 500,00 ₴ and free money grows by 500,00 ₴

#### Scenario: Cannot return more than is frozen
- **GIVEN** "Vacation" holds 2 000,00 ₴
- **WHEN** the user tries to return 2 500,00 ₴
- **THEN** an error is shown and nothing is saved

### Requirement: Show frozen toggle
Settings SHALL have a "Show frozen" switch, on by default. When on, frozen records SHALL be listed, marked as frozen, and the home balance SHALL show the balance minus the frozen total. When off, frozen records SHALL be hidden from the lists and the home balance SHALL show the whole balance. The daily limit, "left today" and the status SHALL be the same in both cases.

#### Scenario: Toggle on
- **GIVEN** the balance is 12 000,00 ₴, 2 000,00 ₴ is frozen today, and "Show frozen" is on
- **WHEN** the home screen is shown
- **THEN** the balance reads 10 000,00 ₴ and today's list shows the freeze marked as frozen

#### Scenario: Toggle off
- **GIVEN** the same data and "Show frozen" is off
- **WHEN** the home screen is shown
- **THEN** the balance reads 12 000,00 ₴, the freeze is not listed, and "left today" is the same as with the toggle on

### Requirement: Frozen categories on the entry screen
The entry screen SHALL show Frozen categories after the Normal ones, each marked with a snowflake.

#### Scenario: Order and mark
- **GIVEN** the Normal categories Food and Transport and the Frozen category Vacation
- **WHEN** the entry screen opens
- **THEN** the buttons are Food, Transport, then Vacation with a snowflake
