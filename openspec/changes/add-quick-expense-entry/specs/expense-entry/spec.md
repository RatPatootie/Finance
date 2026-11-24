# Spec Delta

## Purpose

Lets the user record, review, correct and remove expenses on their iPhone in 2–3 taps, fully offline, with amounts stored as exact kopecks and days counted in Europe/Kyiv time.

## ADDED Requirements

### Requirement: Amount entry with keypad
The entry screen SHALL provide an on-screen keypad with digits 0–9, a decimal separator and backspace. The amount is in UAH with at most two decimal places. It SHALL be stored as an integer number of kopecks.

#### Scenario: Whole hryvnias
- **WHEN** the user types 1, 2, 5
- **THEN** the amount shows "125" and equals 12500 kopecks

#### Scenario: Hryvnias and kopecks
- **WHEN** the user types 4, 9, separator, 9, 9
- **THEN** the amount shows "49.99" and equals 4999 kopecks

#### Scenario: No third decimal digit
- **GIVEN** the amount shows "10.50"
- **WHEN** the user types 7
- **THEN** the amount still shows "10.50"

#### Scenario: Only one separator
- **GIVEN** the amount shows "3.5"
- **WHEN** the user taps the separator again
- **THEN** the amount still shows "3.5"

#### Scenario: Leading zero is replaced
- **GIVEN** the amount is empty
- **WHEN** the user types 0, then 7
- **THEN** the amount shows "7"

#### Scenario: Separator first
- **GIVEN** the amount is empty
- **WHEN** the user taps the separator, then 5
- **THEN** the amount shows "0.5" and equals 50 kopecks

#### Scenario: Backspace
- **GIVEN** the amount shows "12.3"
- **WHEN** the user taps backspace twice
- **THEN** the amount shows "12"

#### Scenario: Upper bound
- **GIVEN** the amount shows "9999999"
- **WHEN** the user types another digit
- **THEN** the amount still shows "9999999" (the maximum is 9 999 999.99 UAH)

### Requirement: Home screen with an add button
The app SHALL open on a home screen that shows today's spending total as its main figure and a button with an add icon at the bottom, within thumb reach. Tapping the button SHALL open the entry screen. The entry screen SHALL have a close control that returns home without saving.

#### Scenario: Open the entry screen
- **GIVEN** the home screen is shown
- **WHEN** the user taps the add button
- **THEN** the entry screen opens with an empty amount and today's date

#### Scenario: Close without saving
- **GIVEN** the entry screen shows the amount "40"
- **WHEN** the user taps close
- **THEN** the home screen is shown and no expense is stored

### Requirement: Saving with one category tap
The entry screen SHALL show small category buttons between the amount and the keypad at all times. When the amount is greater than zero, tapping a category SHALL save the expense right away with that amount, category and the selected date, return to the home screen and confirm the save. When the amount is zero or empty, category buttons SHALL look inactive and SHALL NOT save.

#### Scenario: Save in three taps
- **GIVEN** the user tapped the add button and typed "85"
- **WHEN** the user taps "Food"
- **THEN** an expense of 8500 kopecks in "Food" for today is stored
- **AND** the home screen is shown with a short confirmation

#### Scenario: Zero amount cannot be saved
- **GIVEN** the amount is empty or "0" or "0.00"
- **WHEN** the user taps a category
- **THEN** no expense is stored and the entry screen stays open

#### Scenario: Categories are visible before typing
- **GIVEN** the entry screen just opened
- **WHEN** nothing has been typed
- **THEN** the category buttons are visible but inactive, and they become active once the amount is above zero

#### Scenario: Double tap does not create two expenses
- **GIVEN** the amount shows "40"
- **WHEN** the user taps "Transport" twice quickly
- **THEN** exactly one expense of 4000 kopecks is stored

### Requirement: Date defaults to today in Europe/Kyiv
Each expense SHALL have a calendar date. The date SHALL default to today's date in Europe/Kyiv, whatever the device time zone.

#### Scenario: Late evening in Kyiv
- **GIVEN** the time is 2026-11-30 23:30 in Kyiv (21:30 UTC)
- **WHEN** an expense is saved with the default date
- **THEN** its date is 2026-11-30

#### Scenario: Just after midnight in Kyiv
- **GIVEN** the time is 2026-12-01 00:10 in Kyiv (2026-11-30 22:10 UTC)
- **WHEN** an expense is saved with the default date
- **THEN** its date is 2026-12-01

#### Scenario: Last day of the month
- **GIVEN** today in Kyiv is 2026-02-28
- **WHEN** an expense is saved with the default date
- **THEN** its date is 2026-02-28, and from 00:00 Kyiv time the default becomes 2026-03-01

#### Scenario: Daylight saving change
- **GIVEN** the time is 2026-03-29 03:30 Kyiv summer time, just after the clocks go forward
- **WHEN** an expense is saved with the default date
- **THEN** its date is 2026-03-29

#### Scenario: Device set to another time zone
- **GIVEN** the device time zone is America/New_York, where it is 2026-11-30 19:00, which is 2026-12-01 02:00 in Kyiv
- **WHEN** an expense is saved with the default date
- **THEN** its date is 2026-12-01

#### Scenario: Default refreshes after midnight
- **GIVEN** the app was left open on the entry screen before midnight Kyiv time
- **WHEN** an expense is saved after midnight without changing the date
- **THEN** it gets the new day's date

### Requirement: Choosing another date before saving
The entry screen SHALL let the user pick a date other than today before tapping a category. Future dates SHALL NOT be selectable. The next time the entry screen opens, the date SHALL be today again.

#### Scenario: Log yesterday's purchase
- **GIVEN** today is 2026-11-23 and the user picks 2026-11-22
- **WHEN** the user enters "60" and taps "Fun"
- **THEN** an expense of 6000 kopecks in "Fun" dated 2026-11-22 is stored
- **AND** the next time the entry screen opens, the date is today

#### Scenario: Future date not allowed
- **GIVEN** today is 2026-11-23
- **WHEN** the user opens the date picker
- **THEN** 2026-11-24 and later cannot be chosen

#### Scenario: Non-default date is visible
- **GIVEN** the user picked a date other than today
- **WHEN** the entry screen is shown
- **THEN** the chosen date is clearly shown, so it isn't saved by mistake

### Requirement: Today's expenses and total
The home screen SHALL list today's (Europe/Kyiv) expenses that are not deleted, newest first, each with amount, category and time added, and SHALL show their sum in UAH as its main figure.

#### Scenario: List and total
- **GIVEN** today has expenses of 8500 and 4000 kopecks and none are deleted
- **WHEN** the home screen is shown
- **THEN** both are listed, newest first, and the total shows 125.00 ₴

#### Scenario: Past-dated expense is not in today's list
- **GIVEN** the user saves an expense dated yesterday
- **WHEN** the home screen is shown
- **THEN** that expense is not in today's list and not in today's total

#### Scenario: Empty day
- **GIVEN** today has no expenses
- **WHEN** the home screen is shown
- **THEN** an empty-state message is shown and the total is 0.00 ₴

#### Scenario: Day rolls over
- **GIVEN** the list shows yesterday's items and the app stays open past midnight Kyiv time
- **WHEN** the screen is shown again or comes back to the foreground
- **THEN** the list and total are for the new day

### Requirement: Delete with undo
The user SHALL be able to delete an expense from today's list. Deletion SHALL be a soft delete, so the record is kept and marked deleted with a new updated-at. An Undo action SHALL be offered for at least 5 seconds and fully restore the expense.

#### Scenario: Delete and undo
- **GIVEN** today's list contains an expense of 4000 kopecks
- **WHEN** the user deletes it and taps Undo
- **THEN** the expense is back in the list and the total includes it again

#### Scenario: Delete without undo
- **WHEN** the user deletes an expense and does not tap Undo
- **THEN** the expense leaves the list and the total, and the stored record is marked deleted, not removed

### Requirement: Edit an expense
Tapping an expense in today's list SHALL open an editor for its amount, category and date, with the same amount rules, the same no-future-date rule and the same active-category list as entry. Saving SHALL update the record and its updated-at. Cancelling SHALL change nothing.

#### Scenario: Change amount
- **GIVEN** an expense of 8500 kopecks in "Food"
- **WHEN** the user edits the amount to "58" and saves
- **THEN** the expense is 5800 kopecks and today's total updates

#### Scenario: Move to another day
- **GIVEN** an expense dated today
- **WHEN** the user changes its date to yesterday and saves
- **THEN** it leaves today's list and today's total

#### Scenario: Zero amount rejected in editor
- **WHEN** the user clears the amount in the editor
- **THEN** saving is disabled

#### Scenario: Cancel
- **WHEN** the user changes fields and cancels
- **THEN** the stored expense is unchanged

### Requirement: Expense record
Each expense SHALL have a client-generated unique id, amount in kopecks, category id, date (YYYY-MM-DD, Kyiv), created-at and updated-at timestamps, and a deleted flag.

#### Scenario: New expense has sync fields
- **WHEN** an expense is saved
- **THEN** it has a unique id, deleted = false, and created-at equal to updated-at

#### Scenario: Edit bumps updated-at only
- **WHEN** an expense is edited
- **THEN** updated-at is later than before and id and created-at are unchanged

### Requirement: Offline and persistent
Saving, listing, editing and deleting SHALL work with no network connection. Data SHALL survive closing the app and restarting the phone.

#### Scenario: Airplane mode
- **GIVEN** the phone is offline
- **WHEN** the user saves an expense
- **THEN** it is stored and listed with no error

#### Scenario: Survives restart
- **GIVEN** an expense was saved
- **WHEN** the app is closed and opened again
- **THEN** the expense is still in today's list

#### Scenario: Storage failure is reported
- **GIVEN** saving to device storage fails
- **WHEN** the user taps a category
- **THEN** an error message is shown and the typed amount is kept so the user can try again
