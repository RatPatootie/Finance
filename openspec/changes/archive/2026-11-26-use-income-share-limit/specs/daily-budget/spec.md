# Spec Delta

## ADDED Requirements

### Requirement: Daily limit from income
The daily limit SHALL be the monthly income times the daily share x % divided by the number of days in the current Kyiv month, rounded down to whole kopecks. The balance and frozen money SHALL NOT change it. When no daily share is set, there SHALL be no daily limit. Spending during the day SHALL NOT change the limit.

#### Scenario: Thirty-day month
- **GIVEN** the monthly income is 30 000,00 ₴, the daily share is 40 % and today is 2026-11-24
- **WHEN** the daily limit is worked out
- **THEN** it is 400,00 ₴

#### Scenario: Thirty-one-day month
- **GIVEN** the same income and share and today is 2026-12-05
- **WHEN** the daily limit is worked out
- **THEN** it is 387,09 ₴

#### Scenario: February
- **GIVEN** the same income and share and today is 2027-02-10
- **WHEN** the daily limit is worked out
- **THEN** it is 428,57 ₴

#### Scenario: Spending today does not shrink today's limit
- **GIVEN** the daily limit is 400,00 ₴
- **WHEN** the user saves an expense of 300,00 ₴ for today
- **THEN** the daily limit is still 400,00 ₴

#### Scenario: Balance and frozen money do not matter
- **GIVEN** the daily limit is 400,00 ₴
- **WHEN** the balance becomes negative or 2 000,00 ₴ is frozen
- **THEN** the daily limit is still 400,00 ₴

#### Scenario: No daily share set
- **GIVEN** the daily share has never been set
- **WHEN** the home screen is shown
- **THEN** no daily limit is worked out

#### Scenario: No income
- **GIVEN** the monthly income is 0 and the daily share is 40 %
- **WHEN** the daily limit is worked out
- **THEN** it is 0,00 ₴

## MODIFIED Requirements

### Requirement: Left for today
"Left for today" SHALL be the daily limit minus today's spending. Today's spending SHALL be every non-deleted expense dated today outside Frozen categories, whenever the balance was set. It SHALL be negative when the user spent more than the limit.

#### Scenario: Within the limit
- **GIVEN** the daily limit is 400,00 ₴
- **WHEN** the user spends 150,00 ₴ today
- **THEN** left for today is 250,00 ₴

#### Scenario: Over the limit
- **GIVEN** the daily limit is 400,00 ₴
- **WHEN** the user spends 520,00 ₴ today
- **THEN** left for today is −120,00 ₴

#### Scenario: Spending before the balance was set still counts
- **GIVEN** an expense of 100,00 ₴ was saved today before the balance was entered
- **WHEN** left for today is worked out
- **THEN** that 100,00 ₴ is included in today's spending

#### Scenario: Freezing is not spending
- **WHEN** the user freezes 2 000,00 ₴ today
- **THEN** left for today does not change

### Requirement: Spending status
The status SHALL be red when the daily limit is 0 or left for today is below zero. Otherwise it SHALL be yellow when today's spending is at least 80 % of the daily limit, and green below that.

#### Scenario: Green below 80 %
- **GIVEN** the daily limit is 1 000,00 ₴
- **WHEN** today's spending is 799,99 ₴
- **THEN** the status is green

#### Scenario: Yellow from 80 % up to the limit
- **GIVEN** the daily limit is 1 000,00 ₴
- **WHEN** today's spending is 800,00 ₴ or 1 000,00 ₴
- **THEN** the status is yellow

#### Scenario: Red over the limit
- **GIVEN** the daily limit is 1 000,00 ₴
- **WHEN** today's spending is 1 000,01 ₴
- **THEN** the status is red

#### Scenario: Red with no free money
- **GIVEN** the daily limit is 0,00 ₴
- **WHEN** today's spending is 0,00 ₴
- **THEN** the status is red

## REMOVED Requirements

### Requirement: Daily limit
**Reason**: The limit no longer comes from the balance spread over the rest of the month. It comes from a share of the monthly income ("Daily limit from income").
**Migration**: No data changes. Users set the new "Daily share of income" in Settings; until then the home screen asks for it instead of showing a limit.
