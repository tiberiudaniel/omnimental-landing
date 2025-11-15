OmniMental Landing — Changelog

Date: 2025-11-11

Summary
- Stage 1 (UX/i18n + saving): Centralized copy via lib/i18nGetString, harmonized saving/error states across flows, robust magic-link auth (email passthrough + URL cleanup), AccountModal stability, and public Unsubscribe page (/unsubscribe).
- Stage 2 (Dashboard + OmniIntel): Added StickyMiniSummary, unified gating, real consistency index derived from timeline and patched into progress facts, client fallback for OmniIntel.
- Stage 3 (Sensei/Abil + rules + tests): Sensei rules wiring for quests, Abil unlock via quest completion or practice, stricter Firestore owner checks, and tests for consistency scoring.

2025-11-12 — Gating + Wizard resume + Demo flows

Summary
- Gating: profilul are `selection` (none | individual | group). Jurnalul și Recomandarea completă sunt disponibile doar după alegere. `/choose` este hub-ul pentru probe (Lite/Quick) + exit modal.
- Wizard: alias `/wizard`, header minimal, Escape hatch, resume la primul pas incomplet, `?lang` sincronizat global.
- OmniScop: alias `/omniscop` ⇒ Recomandare când complet; dacă incomplet ⇒ resume wizard.
- Demo: switcher `demo1|demo2|demo3` (dev), badge “Demo” pe Progres și Recomandare, facts/timeline demo.
- Stabilitate Next.js: Suspense pentru toate paginile care folosesc `useSearchParams`.

Details
- Pages/Routing
  - app/wizard/page.tsx: alias către home wizard, guard “completed” ⇒ `/omniscop`, resume `?resume=1` ⇒ primul pas incomplet.
  - app/omniscop/page.tsx: alias Recomandare dacă complet, altfel wizard resume.
  - app/choose/page.tsx: hub + Exit Modal (4 opțiuni), bannere context `?from=reco|lite|quick`.
  - app/omniscop-lite/page.tsx, app/omnicuno/quick-start/page.tsx: pagini demo (jurnal ascuns, badge Demo).
  - app/progress/page.tsx, app/recommendation/page.tsx, app/auth/page.tsx, app/unsubscribe/page.tsx, app/antrenament/page.tsx: conținut CSR învelit în Suspense.

- Components
  - components/SiteHeader.tsx: `wizardMode` face logo-ul ne‑clicabil și afișează “Salvare automată”; jurnal ascuns până la selection.
  - components/WizardRouter.tsx: FAB “Jurnal” pe mobil la reflectionSummary (doar dacă selection permite).
  - components/DemoUserSwitcher.tsx: comutator demo (activ cu `NEXT_PUBLIC_ENABLE_DEMOS=1`).
  - components/QueryLangSync.tsx: aplică `?lang=ro|en` global (în Suspense din layout).

- Lib
  - lib/selection.ts: helper pentru a seta `selection` în profil la alegerea cardului.
  - lib/progressFacts.ts: analytics ușoare `recordExitModalShown`, `recordCtaClicked`; tipări mai stricte; throttling existent.
  - lib/demoData.ts: demo facts tipate corect (fără `any`, fără `readonly`).
  - lib/indicators.ts: cleanup mapping (fără chei duplicate).

- Guards
  - Recomandare: dacă logat și `selection=none` ⇒ redirect `/choose?from=reco`.
  - Jurnal: ascuns în header până la alegere; `?open=journal` respectat doar după alegere.

Upgrade Notes
1) Setează `NEXT_PUBLIC_ENABLE_DEMOS=1` în `.env.local` pentru a vedea switcher-ul Demo.
2) Publică Firestore rules (profil + facts owner-scoped) și asigură Anonymous Auth activ pentru oaspeți.
3) Verifică redirecturile: `/wizard`, `/omniscop`, `/choose`, `/progress?open=journal`.

2025-11-12 — Release Prep (staging/production)

Summary
- Build și lint OK. Gating + wizard + demo stabile. Suspense aplicat pentru toate paginile cu `useSearchParams`.

Release Notes
- Env: în producție setați `NEXT_PUBLIC_ENABLE_DEMOS=0` (pe dev rămâne `1`).
- Rules: publicați `firestore.rules` actualizat (selection/path validat) și confirmați permissiunile.
- QA: rutele principale funcționează cu guarduri (selection=none) și resume wizard.


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

2025-11-13 — Onboarding, Dashboard polish, E2E tests, hydration fix

Summary
- Onboarding (demo + member): stabilized flow with explicit data-testids and E2E coverage.
- Dashboard: Weekly trends Day/Week • Minutes/Sessions toggles, numeric labels, RO copy (“Trend săptămânal”, “Revelația zilei”, “Provocarea de azi”).
- Wizard routing: explicit reflection step between intent → summary; tests updated accordingly.
- Recommendation: fixed hydration mismatch by deferring localStorage read until after hydration.
- Guest path: “Acces Invitat Special” alongside signup CTAs, routes to `/recommendation?demo=1` and sets a guest flag.
- Header UX: Logo always resets to intro: `/?step=preIntro&reset=1`.
- Playwright E2E: multi-user scenarios, edge cases, stress test; migrated selectors to data-testid.

Details
- Components
  - components/dashboard/ProgressDashboard.tsx: added trend toggles with testids; fixed hooks order; derived achievement banner state via useMemo; added chart testid.
  - components/charts/WeeklyTrendsChart.tsx: label + axis polish (used by dashboard).
  - components/IntentCloud.tsx, components/IntentSummary.tsx, components/ReflectionScreen.tsx: added stable testids (wizard-step-*, speed-*, budget-*, emo-*).
  - components/OnboardingIntro.tsx, MiniSelfAssessment.tsx, MiniCunoTest.tsx: added onboarding testids.
  - components/RecommendationStep.tsx: added `data-testid="recommendation-step"`.
  - components/SessionDetails.tsx: added “Acces Invitat Special” CTA.
  - components/SiteHeader.tsx: logo links to `/?step=preIntro&reset=1` in all modes.
- Pages
  - app/recommendation/page.tsx: PublicOrCachedView now reads localStorage in a client effect to avoid SSR hydration mismatch.
- Lib/infra
  - lib/recommendationCache.ts: unchanged API used; reading deferred in page.
- Tests (Playwright)
  - tests/e2e/wizard-multiple-users.spec.ts: 10 scenarios via helper; assertions updated for new copy and testids.
  - tests/e2e/wizard-edge-cases.spec.ts: missing selection, back/change answers, extreme values; uses testids.
  - tests/e2e/wizard-stress-test.spec.ts: 20 randomized runs; waits for reflection step; ignores benign 4xx console noise.
  - tests/e2e/onboarding.spec.ts: full onboarding (intro → self‑assessment → mini‑cuno → recommendation) using testids.
  - tests/e2e/progress.spec.ts: dashboard demo toggles using trend-toggle-* testids.

Open TODOs
- Add dev/QA banner when `NEXT_PUBLIC_DISABLE_PROGRESS_WRITES=1`.
- Consider larger chart height at ≥1366px.
- Expand E2E to cover EN variant and `/recommendation?demo` variants.
