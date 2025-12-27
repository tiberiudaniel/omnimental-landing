# MindPacing → Vocab Matching

## Canonical tag set

All vocab + MindPacing options reference the same frozen enum defined in `config/catVocabulary.ts`:

- `clarity_low`
- `focus_scattered`
- `pace_hurried`
- `energy_low`
- `tension_high`
- `reactive`
- `self_critical`
- `stuck`
- `rigid`
- `sunk_cost`
- `change_resistance`
- `identity_loop`
- `meta_observe`

Each vocab card has exactly one `tagsPrimary` entry from the list (plus optional `tagsSecondary`), and MindPacing answers emit the same tags. This keeps matching deterministic and auditable.

## Matching rules (`lib/vocab/matching.ts`)

### `pickVocabPrimary(ctx, vocabBank)`

1. Try exact match on `tagsPrimary[0]`.
2. If none, try intersecting `tagsSecondary` with the provided secondary tags.
3. If still none, fall back to cards flagged `isBuffer` (e.g. `buffer_space`, `buffer_rhythm`, `recal_stop_frame`), then the entire bank.
4. Exclusions:
   - IDs in `ctx.recentVocabIds.slice(0,5)`.
   - Any vocab last seen on `ctx.avoidDayKeys` (today + yesterday).
5. Priority order: higher `weight`, then “least recently shown”, then alphabetical ID.

### `pickVocabSecondary(ctx, vocabBank, primaryCard)`

Secondary vocab is rare and only emitted when **all** are true:

1. `ctx.shownTodayCount === 0` (i.e. user hasn’t received an extra vocab yet).
2. The MindPacing answer tags include one of the triggers `{ reactive, self_critical, stuck, energy_low }`.
3. Candidate cards must have a different primary tag than the first vocab.
4. Same exclusion rules as above (recent IDs, today/yesterday day keys).

The secondary picker first uses `tagsSecondary`, then `tagsPrimary`. If nothing matches, it aborts (no second vocab that day).

## Persistence / day-keys

LocalStorage stores just enough state to keep the flow repeatable:

- `mind_info_state_v1` – rolling map `dayKey -> { questionId, optionId, vocabPrimaryId, vocabSecondaryId }`.
- `mind_info_rotation_index` + `getLastMindPacingQuestionId` – prevent showing the same MindPacing question two days in a row.
- `omni_vocab_history` – last 7 vocab IDs (used to block short-term repeats).
- `omni_vocab_shown_today_meta` – `{ dayKey, count }`, rate-limits max 2 cards/day.
- `omni_vocab_last_day_by_id` – memo of when each vocab last appeared (blocks same-day/yesterday repeats).
- Existing keys (`omni_vocab_unlocked`, `omni_vocab_shown_day`, `omni_vocab_shown_meta`) are still used by onboarding + DailyPath; showing a vocab now auto-unlocks it silently.

MindPacing itself uses `getTodayKey()` for the day key, and it records the tag + vocab ids via `storeMindPacingAnswer`. On reload the UI replays the stored selection, so the sequence remains deterministic and telemetry-friendly.
