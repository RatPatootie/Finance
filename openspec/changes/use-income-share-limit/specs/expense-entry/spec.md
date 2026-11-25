# Spec Delta

## MODIFIED Requirements

### Requirement: Home screen with an add button
The app SHALL open on a home screen whose main figure is the current balance, with a short "left today" line smaller underneath in its status colour (green, yellow or red). When left for today is negative it SHALL read as the amount "over today". Before any balance is set, the home screen SHALL show a prompt to set the balance instead; before a daily share is set, it SHALL show a prompt to set the share instead of the "left today" line. Both prompts SHALL open Settings. Below the balance SHALL come a small add button, then the week strip, then the chosen day's list. The add button SHALL open the entry screen, which SHALL have a close control that returns home without saving. The list SHALL show only the 3 newest records, with the day total and a control to show the rest.

#### Scenario: Open the entry screen
- **GIVEN** the home screen is shown
- **WHEN** the user taps the add button
- **THEN** the entry screen opens with an empty amount and today's date

#### Scenario: Close without saving
- **GIVEN** the entry screen shows the amount "40"
- **WHEN** the user taps close
- **THEN** the home screen is shown and no expense is stored

#### Scenario: Order on the home screen
- **WHEN** the home screen is shown
- **THEN** from top to bottom it shows the balance, the add button, the week strip and the day's list

#### Scenario: Balance and left for today
- **GIVEN** the balance is 11 700,00 ₴, the daily limit is 400,00 ₴ and 150,00 ₴ was spent today
- **WHEN** the home screen is shown
- **THEN** the main figure is "11 700,00 ₴"
- **AND** underneath it reads "250,00 ₴ left today" in green

#### Scenario: Over the limit
- **GIVEN** the daily limit is 400,00 ₴ and 520,00 ₴ was spent today
- **WHEN** the home screen is shown
- **THEN** underneath the balance it reads "120,00 ₴ over today" in red

#### Scenario: No balance yet
- **GIVEN** no balance has been set
- **WHEN** the home screen is shown
- **THEN** it shows a prompt to set the balance instead of the balance
- **AND** tapping the prompt opens Settings

#### Scenario: No daily share yet
- **GIVEN** the balance is set but the daily share is not
- **WHEN** the home screen is shown
- **THEN** instead of "left today" it shows a prompt to set the daily share, which opens Settings

#### Scenario: Figures update after a save
- **GIVEN** the home screen shows a balance of 12 000,00 ₴
- **WHEN** the user adds an expense of 85,00 ₴ for today and returns home
- **THEN** the balance shows 11 915,00 ₴ and left for today is 85,00 ₴ lower

#### Scenario: Only the 3 newest expenses are listed
- **GIVEN** 5 expenses were saved today
- **WHEN** the home screen is shown
- **THEN** the 3 newest are listed, the total covers all 5, and a "Show all 5" control is shown

#### Scenario: Show the rest
- **GIVEN** the home screen lists 3 of today's 5 expenses
- **WHEN** the user taps "Show all 5"
- **THEN** all 5 are listed and the control changes to "Show less"

#### Scenario: Three or fewer
- **GIVEN** 3 expenses were saved today
- **WHEN** the home screen is shown
- **THEN** all 3 are listed and no show-all control is shown

## ADDED Requirements

### Requirement: Today's budget bar
When a daily limit is set, the home screen SHALL show under the "left today" line a thin bar of how much of today's limit is used, with no visible text; screen readers SHALL hear the spent amount and the limit. The bar SHALL fill in proportion to today's spending, capped at full, in the status colour (so it is full and red once the limit is exceeded or when the limit is 0). Without a daily limit there SHALL be no bar.

#### Scenario: Part of the limit used
- **GIVEN** the daily limit is 400,00 ₴ and 150,00 ₴ was spent today
- **WHEN** the home screen is shown
- **THEN** the bar is 37,5 % full and green, with no text beside it

#### Scenario: Over the limit
- **GIVEN** the daily limit is 400,00 ₴ and 520,00 ₴ was spent today
- **WHEN** the home screen is shown
- **THEN** the bar is full and red

#### Scenario: No daily share
- **GIVEN** no daily share is set
- **WHEN** the home screen is shown
- **THEN** no bar is shown
