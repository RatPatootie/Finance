# Spec Delta

## Purpose

Shows the user's week at a glance, with which days had spending and which went over the limit, and lets them open any day's records and move between weeks.

## ADDED Requirements

### Requirement: Week strip on the home screen
The home screen SHALL show, below today's list, a strip of 7 day squares from Monday to Sunday of one Kyiv week, with a previous-week arrow on the left, a next-week arrow on the right, and a label with the week's dates. It SHALL open on the current week. Each square SHALL show the weekday and the day of the month.

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
- plain when the day has no records;
- green when it has spending within that day's limit;
- red when spending is over that day's limit;
- neutral when it has records but no known limit, because it is before the balance was set or no balance is set.

Today SHALL have a ring. Days after today SHALL be dimmed and SHALL NOT be selectable.

#### Scenario: Within and over the limit
- **GIVEN** the daily limit was 500,00 ₴ on Monday and 500,00 ₴ on Tuesday
- **AND** 200,00 ₴ was spent on Monday and 620,00 ₴ on Tuesday
- **WHEN** the strip is shown
- **THEN** Monday is green and Tuesday is red

#### Scenario: No records
- **WHEN** a past day has no records
- **THEN** its square is plain

#### Scenario: Before the balance was set
- **GIVEN** the balance was saved on 2026-11-24 and an expense is dated 2026-11-20
- **WHEN** the week of 16–22 Nov is shown
- **THEN** 20 Nov is neutral

#### Scenario: Future days
- **GIVEN** today is Tuesday 2026-11-24
- **WHEN** the user taps Thursday 26
- **THEN** nothing happens and the square stays dimmed

### Requirement: Limit of a past day
The limit used for a day's colour SHALL be worked out with the daily-limit rule as of that day: the money at the start of that day, counting only records dated on or before it, divided by the days left in its month including that day.

#### Scenario: Same rule as today
- **GIVEN** the balance was saved as 12 000,00 ₴ on 2026-11-24 before any spending
- **WHEN** the colour of 2026-11-24 is worked out
- **THEN** its limit is 1 714,28 ₴

### Requirement: The chosen day fills the main list
The home screen's main list, between the add button and the week strip, SHALL show the chosen day. It SHALL start on today. Tapping a past day or today in the strip SHALL choose it: the main list SHALL show that day's records, newest first, with its total, a heading with the day ("Today" for today), and the same edit and delete controls. The chosen day SHALL stay chosen when switching weeks. While a past day is chosen, the add button SHALL open the entry screen on that day.

#### Scenario: Choose a past day
- **GIVEN** 2 expenses were saved on Sunday 22 Nov and today is Monday 23 Nov
- **WHEN** the user goes to the previous week and taps Sunday 22
- **THEN** the main list is headed "Sun 22 Nov" and shows those 2 expenses and their total

#### Scenario: Edit the chosen day
- **GIVEN** Sunday 22 Nov is chosen
- **WHEN** the user deletes one of its expenses from the main list
- **THEN** the list and its total update, with Undo available

#### Scenario: Add to the chosen day
- **GIVEN** Sunday 22 Nov is chosen
- **WHEN** the user taps the add button
- **THEN** the entry screen opens with the date Sun 22 Nov

#### Scenario: Back to today
- **GIVEN** Sunday 22 Nov is chosen
- **WHEN** the user taps today in the strip
- **THEN** the main list is headed "Today" and the add button opens the entry screen on today