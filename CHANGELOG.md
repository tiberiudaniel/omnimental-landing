OmniMental Landing — Changelog

Date: 2025-11-11

Summary
- Stage 1 (UX/i18n + saving): Centralized copy via lib/i18nGetString, harmonized saving/error states across flows, robust magic-link auth (email passthrough + URL cleanup), AccountModal stability, and public Unsubscribe page (/unsubscribe).
- Stage 2 (Dashboard + OmniIntel): Added StickyMiniSummary, unified gating, real consistency index derived from timeline and patched into progress facts, client fallback for OmniIntel.
- Stage 3 (Sensei/Abil + rules + tests): Sensei rules wiring for quests, Abil unlock via quest completion or practice, stricter Firestore owner checks, and tests for consistency scoring.

2025-11-12 — Rebrand “Evaluare” → “Antrenament” + Omni Path

Summary
- Rebrand Evaluare → Antrenament (Practice Hub); redirect permanent din /evaluation la /antrenament; header nav actualizat (i18n: navAntrenament, navProgres).
- Omni Path Row: 5 carduri compacte (Scope, Kuno, Sensei, Abil, Intel) cu status + CTA + lock hint.
- Omni Path integrat sus în /progress și /antrenament; reguli de unlock MVP în lib/unlockState.ts.
- Recommendation recall stabil (guest cache + member refresh). Firestore writes cu throttling + dedupe.

Details
- Pages/Routing
  - app/antrenament/page.tsx (nou): hub de practică, include OmniPathRow + tab-uri module (OS/OC/OSE/OA/OI).
  - app/evaluation/page.tsx: redirect către /antrenament.
- Components
  - components/OmniPathRow.tsx (nou): hartă compactă a drumului Omni.
- Lib
  - lib/unlockState.ts (nou): calculează starea de deblocare pentru fiecare modul (MVP heuristics).
  - lib/recommendationCache.ts (anterior): salvează/recuperează ultima recomandare (guest), cu selectedPath.
  - lib/progressFacts.ts: throttling (800ms) + dedupe (1.5s) la mergeProgressFact.

Notes
- UI copy: i18n adăugat pentru nav/titluri/subtitluri Antrenament/Progres.
- Următorul pas: Sensei v1 (quest-uri + completare), Abil v1 (SkillsIndex), OmniIntel v1 complet, i18n + tipografie sweep.

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
