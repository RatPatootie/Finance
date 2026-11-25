# frozen-money Specification

## Purpose

Lets the user set money aside in frozen categories so the daily limit ignores it, and move it back to the free money later.

## Requirements

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

### Requirement: Frozen categories on the entry screen
The entry screen SHALL show Frozen categories after the Normal ones, each marked with a snowflake.

#### Scenario: Order and mark
- **GIVEN** the Normal categories Food and Transport and the Frozen category Vacation
- **WHEN** the entry screen opens
- **THEN** the buttons are Food, Transport, then Vacation with a snowflake

### Requirement: Frozen records are always listed and out of the shown balance
Frozen records (freezes and returns) SHALL always be shown in the day lists, marked as frozen, on every day they are dated. The balance shown on the home screen SHALL always be the balance minus the frozen total.

#### Scenario: Freeze is listed and taken off the shown balance
- **GIVEN** the balance is 12 000,00 ₴
- **WHEN** the user freezes 2 000,00 ₴ today
- **THEN** the home balance reads 10 000,00 ₴ and today's list shows the freeze marked as frozen

#### Scenario: Past day still shows its freeze
- **GIVEN** a freeze was saved on Sunday 22 Nov
- **WHEN** the user chooses Sunday 22 Nov in the week strip
- **THEN** the freeze is listed, marked as frozen
