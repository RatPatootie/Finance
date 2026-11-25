# week-overview Specification

## Purpose

Shows the user's week at a glance, with which days had spending and which went over the limit, and lets them open any day's records and move between weeks.

## Requirements

### Requirement: Week strip on the home screen
The home screen SHALL show, between the add button and the day's list, a strip of 7 day squares from Monday to Sunday of one Kyiv week, with a previous-week arrow on the left, a next-week arrow on the right, and a label with the week's dates. It SHALL open on the current week. Each square SHALL show the weekday and the day of the month.

#### Scenario: Current week on open
- **GIVEN** today is Tuesday 2026-11-24
- **WHEN** the home screen opens
- **THEN** the strip shows Monday 23 to Sunday 29 November with the label "23–29 Nov"

### Requirement: Switching weeks
The previous-week arrow SHALL show the week before. The next-week arrow SHALL show the week after, and SHALL be disabled while the current week is shown.

#### Scenario: Go back and forward
- **GIVEN** the strip shows 23–29 Nov
- **WHEN** the user taps the previous-week arrow
- **THEN** it shows 16–22 Nov
- **AND WHEN** the user taps the next-week arrow
- **THEN** it shows 23–29 Nov and the next-week arrow is disabled

#### Scenario: Across a month boundary
- **WHEN** the user goes back to the week containing 2026-11-01
- **THEN** the label reads "26 Oct – 1 Nov"

### Requirement: Day colours
Each square SHALL be coloured by its day:
- plain when the day has no spending;
- green when spending is within that day's limit;
- red when spending is over that day's limit;
- neutral when it has spending but no daily share is set.

Frozen records SHALL NOT count as spending here. Today SHALL have a ring. Days after today SHALL be dimmed and SHALL NOT be selectable.

#### Scenario: Within and over the limit
- **GIVEN** the daily limit is 500,00 ₴
- **AND** 200,00 ₴ was spent on Monday and 620,00 ₴ on Tuesday
- **WHEN** the strip is shown
- **THEN** Monday is green and Tuesday is red

#### Scenario: No records
- **WHEN** a past day has no records
- **THEN** its square is plain

#### Scenario: No daily share
- **GIVEN** no daily share is set and an expense is dated 2026-11-20
- **WHEN** the week of 16–22 Nov is shown
- **THEN** 20 Nov is neutral

#### Scenario: Before the balance was set
- **GIVEN** the daily share is set, the balance was saved on 2026-11-24, and an expense within the limit is dated 2026-11-20
- **WHEN** the week of 16–22 Nov is shown
- **THEN** 20 Nov is green, because the limit no longer depends on the balance

#### Scenario: Future days
- **GIVEN** today is Tuesday 2026-11-24
- **WHEN** the user taps Thursday 26
- **THEN** nothing happens and the square stays dimmed

### Requirement: Limit of a past day
The limit used for a day's colour SHALL be the monthly income times the daily share divided by the number of days in that day's month, rounded down to whole kopecks, using the current income and share.

#### Scenario: Same rule as today
- **GIVEN** the monthly income is 30 000,00 ₴ and the daily share is 40 %
- **WHEN** the colour of 2026-11-24 is worked out
- **THEN** its limit is 400,00 ₴, the same as today's limit

#### Scenario: Day in a 31-day month
- **GIVEN** the monthly income is 30 000,00 ₴ and the daily share is 40 %
- **WHEN** the colour of 2026-10-20 is worked out
- **THEN** its limit is 387,09 ₴

### Requirement: The chosen day fills the main list
The home screen's day list, below the week strip, SHALL show the chosen day. It SHALL start on today. Tapping a past day or today in the strip SHALL choose it: the list SHALL show that day's records, newest first, with its total, a heading with the day ("Today" for today), and the same edit and delete controls. The chosen day SHALL stay chosen when switching weeks. While a past day is chosen, the add button SHALL open the entry screen on that day.

#### Scenario: Choose a past day
- **GIVEN** 2 expenses were saved on Sunday 22 Nov and today is Monday 23 Nov
- **WHEN** the user goes to the previous week and taps Sunday 22
- **THEN** the list is headed "Sun 22 Nov" and shows those 2 expenses and their total

#### Scenario: Edit the chosen day
- **GIVEN** Sunday 22 Nov is chosen
- **WHEN** the user deletes one of its expenses from the list
- **THEN** the list and its total update, with Undo available

#### Scenario: Add to the chosen day
- **GIVEN** Sunday 22 Nov is chosen
- **WHEN** the user taps the add button
- **THEN** the entry screen opens with the date Sun 22 Nov

#### Scenario: Back to today
- **GIVEN** Sunday 22 Nov is chosen
- **WHEN** the user taps today in the strip
- **THEN** the list is headed "Today" and the add button opens the entry screen on today
