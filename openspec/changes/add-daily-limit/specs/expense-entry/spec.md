# Spec Delta

## MODIFIED Requirements

### Requirement: Home screen with an add button
The app SHALL open on a home screen whose main figure is the current balance, with "left for today" smaller underneath in its status colour (green, yellow or red) and the daily limit next to it. When left for today is negative it SHALL read as "over by" the amount. Before any balance is set, the home screen SHALL show a prompt to set the balance that opens Settings, instead of the balance. The home screen SHALL have a button with an add icon at the bottom, within thumb reach. Tapping the button SHALL open the entry screen. The entry screen SHALL have a close control that returns home without saving. Today's list on the home screen SHALL show only the 3 newest expenses, with the day total and a control to show the rest, so the space below stays free for other content.

#### Scenario: Open the entry screen
- **GIVEN** the home screen is shown
- **WHEN** the user taps the add button
- **THEN** the entry screen opens with an empty amount and today's date

#### Scenario: Close without saving
- **GIVEN** the entry screen shows the amount "40"
- **WHEN** the user taps close
- **THEN** the home screen is shown and no expense is stored

#### Scenario: Balance and left for today
- **GIVEN** the balance is 11 700,00 ₴, the daily limit is 1 714,28 ₴ and 300,00 ₴ was spent today
- **WHEN** the home screen is shown
- **THEN** the main figure is "11 700,00 ₴"
- **AND** underneath it reads left for today "1 414,28 ₴" of "1 714,28 ₴" in green

#### Scenario: Over the limit
- **GIVEN** the daily limit is 500,00 ₴ and 620,00 ₴ was spent today
- **WHEN** the home screen is shown
- **THEN** underneath the balance it reads over by "120,00 ₴" in red

#### Scenario: No balance yet
- **GIVEN** no balance has been set
- **WHEN** the home screen is shown
- **THEN** it shows a prompt to set the balance instead of the balance
- **AND** tapping the prompt opens Settings

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
