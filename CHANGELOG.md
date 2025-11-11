OmniMental Landing — Changelog

Date: 2025-11-11

Summary
- Stage 1 (UX/i18n + saving): Centralized copy via lib/i18nGetString, harmonized saving/error states across flows, robust magic-link auth (email passthrough + URL cleanup), AccountModal stability, and public Unsubscribe page (/unsubscribe).
- Stage 2 (Dashboard + OmniIntel): Added StickyMiniSummary, unified gating, real consistency index derived from timeline and patched into progress facts, client fallback for OmniIntel.
- Stage 3 (Sensei/Abil + rules + tests): Sensei rules wiring for quests, Abil unlock via quest completion or practice, stricter Firestore owner checks, and tests for consistency scoring.

Details
- Wizard
  - No setState in effects patterns; layout sizing via useSyncExternalStore.
  - IntentSummary/RecommendationStep now show saving and error message consistently.
- Dashboard (/progress)
  - Sticky mini-summary for OmniIntel + level, above NextBestStep.
  - Consistency index computed from evaluation timeline and persisted; OmniIntel recalculated and patched.
  - Dev action to validate Abil unlock: “Complete a quest” button.
- Auth
  - Magic link: include auth_email in continue URL; finalize without prompt; clean URL.
  - Unsubscribe page with Suspense-wrapped useSearchParams.
- Firestore
  - Owner checks on snapshots/journeys/assessments/quest suggestions.
  - Public create for emailUnsubscribes and signups.
- Tests
  - Added computeConsistencyIndexFromDates test; kept recommendation/scoring tests.

Breaking Changes
- Firestore rules now require profileId == auth.uid for creates and reads of user-specific docs.

Upgrade Notes
1) Ensure Firebase Auth Email Link is enabled and the app domain is authorized.
2) Set NEXT_PUBLIC_FIREBASE_AUTH_CONTINUE_URL to your app origin.
3) Publish updated Firestore rules.

