# Spec Delta

## ADDED Requirements

### Requirement: Daily share of income
Settings SHALL have a "Daily share of income" row where the user enters, on the digit keypad, the whole percent of the monthly income meant for daily spending, from 1 to 100. Until it is entered the row SHALL read "Not set". Values outside 1–100 SHALL show an error and SHALL NOT be saved.

#### Scenario: Set the share
- **GIVEN** the daily share is not set
- **WHEN** the user enters 40 and saves
- **THEN** the row reads "40 %" and the daily limit uses 40 %

#### Scenario: Out of range
- **WHEN** the user enters 0 or 150
- **THEN** an error is shown and Save does nothing

#### Scenario: Existing users after the update
- **GIVEN** settings saved by the previous version, with no daily share
- **WHEN** the new version opens
- **THEN** the balance, income and payday are unchanged and the daily share reads "Not set"
