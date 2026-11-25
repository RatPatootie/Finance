# Spec Delta

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Show frozen toggle
**Reason**: Frozen money is now always listed and never part of the shown balance, so there is nothing to switch.
**Migration**: The switch is removed from Settings. A stored `showFrozen` value is kept in the settings record and ignored, so no data changes.
