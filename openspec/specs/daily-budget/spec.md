# daily-budget Specification

## Purpose

Tells the user how much money they have and how much they can still spend today so the money lasts until the end of the month, with a colour that shows at a glance whether they are on track.

## Requirements

### Requirement: Current balance
The current balance SHALL be the balance the user last saved, plus the monthly income for each payday after the day it was saved up to and including today, minus every counted expense. Records in Frozen categories (freezes and returns) SHALL NOT be expenses: they set money aside but never change the balance. An expense SHALL be counted when it is not deleted and its spending day is after the day the balance was saved, or is that same day and it was recorded after the balance was saved. The balance MAY be negative.

#### Scenario: Expenses after setting the balance are subtracted
- **GIVEN** the balance was saved as 12 000,00 ₴ on 2026-11-24 at 09:00 Kyiv
- **WHEN** an expense of 300,00 ₴ dated 2026-11-24 is saved at 13:00
- **THEN** the balance is 11 700,00 ₴

#### Scenario: Expenses already in the saved balance are not subtracted
- **GIVEN** an expense of 85,00 ₴ dated 2026-11-24 was recorded at 08:00
- **WHEN** the balance is saved as 12 000,00 ₴ at 09:00 the same day
- **THEN** the balance is 12 000,00 ₴

#### Scenario: Backdated expense before the balance day is ignored
- **GIVEN** the balance was saved on 2026-11-24
- **WHEN** an expense dated 2026-11-20 is saved
- **THEN** the balance does not change

#### Scenario: Backdated expense after the balance day is subtracted
- **GIVEN** the balance was saved as 12 000,00 ₴ on 2026-11-20 and today is 2026-11-24
- **WHEN** an expense of 100,00 ₴ dated 2026-11-22 is saved
- **THEN** the balance is 11 900,00 ₴

#### Scenario: Editing and deleting change the balance
- **GIVEN** a counted expense of 300,00 ₴ and a balance of 11 700,00 ₴
- **WHEN** the expense is changed to 200,00 ₴
- **THEN** the balance is 11 800,00 ₴
- **AND WHEN** the expense is then deleted
- **THEN** the balance is 12 000,00 ₴

#### Scenario: Income arrives on payday
- **GIVEN** the balance was saved as 10 000,00 ₴ on 2026-11-24, the monthly income is 30 000,00 ₴ and the payday is 25
- **WHEN** it becomes 2026-11-25 in Kyiv
- **THEN** the balance is 40 000,00 ₴

#### Scenario: Income on the day the balance was saved is already included
- **GIVEN** the payday is 24 and the balance was saved on 2026-11-24
- **WHEN** the balance is shown that day
- **THEN** no income is added on top of the saved balance

#### Scenario: Payday beyond the end of a short month
- **GIVEN** the payday is 31 and the balance was saved on 2027-02-10
- **WHEN** it becomes 2027-02-28 in Kyiv
- **THEN** the monthly income is added that day

#### Scenario: Freezing does not change the balance
- **GIVEN** the balance is 12 000,00 ₴
- **WHEN** the user freezes 2 000,00 ₴ into "Vacation"
- **THEN** the balance is still 12 000,00 ₴

### Requirement: Daily limit
The daily limit SHALL be the free money at the start of today divided by the days left in the Kyiv month including today, rounded down to whole kopecks. Free money at the start of today SHALL be the current balance plus today's counted expenses, minus the frozen total. When that free money is zero or less, the daily limit SHALL be 0. Spending during the day SHALL NOT change the limit.

#### Scenario: Limit for the rest of the month
- **GIVEN** today is 2026-11-24 (7 days left including today) and the free money at the start of today is 12 000,00 ₴
- **WHEN** the daily limit is worked out
- **THEN** it is 1 714,28 ₴

#### Scenario: Spending today does not shrink today's limit
- **GIVEN** the daily limit is 1 714,28 ₴
- **WHEN** the user saves an expense of 300,00 ₴ for today
- **THEN** the daily limit is still 1 714,28 ₴

#### Scenario: Last day of the month
- **GIVEN** today is 2026-11-30 and the free money at the start of today is 500,00 ₴
- **WHEN** the daily limit is worked out
- **THEN** it is 500,00 ₴

#### Scenario: First day of a new month
- **GIVEN** today is 2026-12-01 and the free money at the start of today is 3 100,00 ₴
- **WHEN** the daily limit is worked out
- **THEN** it is 100,00 ₴ (31 days left)

#### Scenario: Negative free money
- **GIVEN** the free money at the start of today is −200,00 ₴
- **WHEN** the daily limit is worked out
- **THEN** it is 0,00 ₴

#### Scenario: A new day gets a new limit
- **GIVEN** the app stays open from 23:50 on 2026-11-24
- **WHEN** it becomes 00:00 on 2026-11-25 in Kyiv
- **THEN** the daily limit is worked out again for 6 days left

#### Scenario: Frozen money is left out of the limit
- **GIVEN** today is 2026-11-24 (7 days left), the balance at the start of today is 12 000,00 ₴ and 2 000,00 ₴ is frozen
- **WHEN** the daily limit is worked out
- **THEN** it is 1 428,57 ₴

#### Scenario: Returning frozen money raises the limit
- **GIVEN** the situation above
- **WHEN** the user returns 2 000,00 ₴ to the balance
- **THEN** the daily limit is 1 714,28 ₴

### Requirement: Left for today
"Left for today" SHALL be the daily limit minus today's counted expenses. It SHALL be negative when the user spent more than the limit.

#### Scenario: Within the limit
- **GIVEN** the daily limit is 1 714,28 ₴
- **WHEN** the user spends 300,00 ₴ today
- **THEN** left for today is 1 414,28 ₴

#### Scenario: Over the limit
- **GIVEN** the daily limit is 500,00 ₴
- **WHEN** the user spends 620,00 ₴ today
- **THEN** left for today is −120,00 ₴

### Requirement: Spending status
The status SHALL be red when the daily limit is 0 or left for today is below zero. Otherwise it SHALL be yellow when today's counted spending is at least 80 % of the daily limit, and green below that.

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
