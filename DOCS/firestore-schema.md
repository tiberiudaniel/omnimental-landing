# Firestore Schema (QA Cheatsheet)

The webapp writes to the following collections. The rules now validate the core fields so QA can spot server‑side rejects faster.

## userIntentSnapshots

- `profileId`, `ownerUid`: must match the authenticated user.
- `lang`: enforced as `ro` or `en`.
- `timestamp` is required and must be a Firestore `timestamp`.
- Contains entry metadata (`tags`, `categories`, `evaluation`, `omni`, etc.) created when the wizard saves the intent summary.

## userJourneys

- `profileId`: must match the signed‑in user.
- `choice` / `recommendedPath`: only `individual` or `group`.
- `lang`: `ro` / `en`.
- `timestamp`: validated as a `timestamp`.
- Holds the final journey selection (cards step) along with optional recommendation extras.

## userInterests

- Accepts anonymous journal snippets that feed the intent cloud.
- Writes now require auth, the text length ≤ 1000 chars, and a valid language.
- Updates/deletes are blocked to avoid tampering with the public backlog.

## userProgressFacts

- Mirrors sections from snapshots (intent, motivation, evaluation, recommendation, omni).
- `backfillProgressFacts` (called from `useProgressFacts`) rehydrates empty profiles by reading the latest snapshot and journal entry.
- Snapshot hydration enforces dimension score sanitisation on the server.

> Tip: When QA seeds data manually, ensure `lang`, `choice`, and `timestamp` fields comply with these constraints, otherwise writes will fail client‑side with `permission-denied`.  
> Use the schema above as a checklist when verifying Firestore mutations during a test run. For additional derived metrics see `lib/dashboard/progressSelectors.ts` and the unit tests under `tests/unit/`.
