## Executive summary
- Canary-local today keys landed and self-tests exist, but the legacy `lib/dailyReset.ts` path still emits UTC keys which will desync streaks once we enable daily check-ins.
- Session plan reuse works for Initiation but the saved payload only stores `worldId/mode = initiation`; other worlds will need the same scaffolding before we generalise.
- Completion idempotence is now enforced through `runId`, yet we still allow “deep mode” to reuse the same stored plan/runId, so a deep retry could be blocked after one completion.
- Mindpacing fallbacks surface telemetry plus dev banners; copy is developer-facing (“Inițiere · World 1”) but acceptable for the stabilization pass.
- Progress L1 finally reflects module/lesson progress, though data comes purely from local storage and disappears on device/window change until Firestore mirrors it.
- Terminology (World/Zone) is aligned with docs across Flow Studio and Today, no remaining “World = UI chunk” strings were found.
- Tests cover today key boundaries, initiation registries, and gating; typecheck/test scripts run on CI (Node 22) and local tsx bootstrap keeps Firebase mocked.
- UX entry points in Today keep a single CTA, but we lack a user-facing warning when mindpacing falls back in production (only telemetry), which may complicate support/debug.
- Documentation still implies “Step = Screen” in several specs; code assumes them interchangeably inside Flow Studio, so we need explicit notes before onboarding more authors.
- Spaced repetition loop is missing entirely: we persist completions but have no notion of lesson spacing or re-entry logic inside Today/Progress.

## What is solid
- Canary timezone helper (`lib/time/todayKey.ts`) now drives `lib/dailyCompletion.ts`, closing the UTC-midnight race for Initiation loops.
- Initiation session builder derives lessons from registry/module definitions and exposes debug metadata for analytics.
- Run-completion idempotence leverages `lib/content/initiationRunHistory.ts` with per-user storage keys and tests.
- Mindpacing mapping + fallback telemetry is deterministic, and dev-only banners/dev reset action allow rapid diagnosis.
- Progress L1 surfaces minimal Initiation facts (module title, lesson count, streak, next lesson CTA) per spec.
- Flow Studio UI now uses “Zone/Arie” labels exclusively; no lingering “Worlds” copy found.
- Tests (v4) run via `node --test` with tsx loader and disable telemetry by default.
- Local initiation progress storage includes legacy migration and per-user namespace.

## What can break the product / launch
- The legacy `lib/dailyReset.ts` getTodayKey still uses UTC; streaks/check-ins will drift for Canary users (FAIL-B1).
- Plan locking lacks regression tests, and the saved payload is Initiation-only—future worlds will silently reuse incorrect plans (FAIL-B2).
- Spaced repetition/lesson spacing is absent; users can spam lessons in one day, conflicting with spec (FAIL-F4).
- Progress facts merge is local-only; remote Firestore initiation facts are never written, so cross-device continuity fails (FAIL-C1).
- Step vs Screen terminology still ambiguous in docs/code comments; future authoring risk (FAIL-A2).

## PASS/FAIL checklist
| Item | Status |
| --- | --- |
| A1. Terminology aligns with taxonomy (World/Zone naming) | ✅ PASS |
| A2. Step vs Screen clarity documented/guarded | ❌ FAIL |
| B1. todayKey/timezone uses Canary everywhere | ❌ FAIL |
| B2. Session plan locking & versioning invariants covered/tested | ❌ FAIL |
| B3. Completion idempotence enforced | ✅ PASS |
| B4. Mindpacing mapping + telemetry + dev observability | ✅ PASS |
| C1. Progress L1 minimal facts + UI + remote persistence | ❌ FAIL |
| D1. Storage/migration per-user, reset gated | ✅ PASS |
| E1. Typecheck/tests run & cover new logic | ⚠️ PARTIAL (tests run, typecheck pending due to WSL) |
| F1. UX friction scan per spec | ⚠️ PARTIAL (risks noted) |

### FAIL details
- **FAIL A2 — Step vs Screen ambiguity**  
  - **Files**: `DOCS/ARCHITECTURE/world-initiation-spec.md` (Step terminology), `components/admin/flowStudio/*` (StepRunner usage)  
  - **Issue**: Docs still refer to “Step” where code treats each StepRunner node as a “Screen”; no code comments clarifying the distinction.  
  - **Fix**: Add a short subsection in both docs defining Step vs Screen, and add inline comments in Flow Studio runtime noting that Step IDs map 1:1 to screen routes today.

- **FAIL B1 — Canary timezone not enforced in daily reset**  
  - **Files**: `lib/dailyReset.ts:1-110`, `lib/earnedRounds.ts:1-25`, `lib/omniState.ts:1-35`  
  - **Issue**: These modules still call their own UTC-based `getTodayKey`, ignoring the new Canary helper. Streaks/check-ins will roll over at UTC midnight.  
  - **Fix**: Refactor to import `lib/time/todayKey.ts`, update tests accordingly, and add regression tests for DST.

- **FAIL B2 — Plan locking lacks tests & generalisation**  
  - **Files**: `components/today/TodayOrchestrator.tsx:300-420`, `lib/todayPlanStorage.ts:1-42`  
  - **Issue**: Template ID + runId generation only handled for Initiation; no automated tests verify reuse vs rebuild.  
  - **Fix**: Write targeted unit tests (Node/test) mocking plan storage to ensure reuse logic, and generalise storage schema before other worlds re-enter Today.

- **FAIL C1 — Initiation facts never hit remote profile**  
  - **Files**: `components/useProgressFacts.ts:1-80`, Firestore recorders  
  - **Issue**: We only enrich local `ProgressFact` objects; nothing writes initiation module progress into Firestore, so another device sees blank progress.  
  - **Fix**: Extend `progressFacts/recorders` to persist initiation facts server-side and have the hook prefer remote data when available.

- **FAIL E1 — Typecheck not run locally**  
  - **Files**: CI logs / developer environment  
  - **Issue**: `npx tsc --noEmit` fails on WSL1; no local verification.  
  - **Fix**: Run in CI (already configured) and document that local runs require Node 22 outside WSL1; optional GitHub Action badge to show status.

## Top 10 fixes (impact order)
1. **Adopt Canary todayKey in `lib/dailyReset.ts` and dependents** — Prevents streak/desync bugs for all Canary users; without it, habit loops break daily.  
2. **Add regression tests for plan locking/runId reuse** — Ensures Initiation plans don’t regenerate unexpectedly; lacking tests risks reintroducing duplicates.  
3. **Persist initiation facts into Firestore** — Guarantees Progress L1 works cross-device; otherwise, users lose progress when switching devices.  
4. **Document & enforce Step vs Screen terminology** — Prevents future Flow Studio confusion; without clarity, authors may ship miswired steps.  
5. **Generalise plan storage schema (world/mode/version)** — Prepares for PERFORMING/MASTERING; without it, future worlds will fight over the same key.  
6. **Expose mindpacing fallback to support (prod banner/log)** — Support currently only has telemetry; add subtle UI copy/log to aid debugging.  
7. **Record initiation module progress server-side** — Complements local facts, unlocking analytics and spaced repetition heuristics.  
8. **Add DST-specific todayKey test case** — Canary observes DST; add a spring-forward/fall-back test to ensure helper remains accurate.  
9. **Automate typecheck in CI badge & doc local constraints** — Avoids accidental drift; currently devs may skip typecheck due to WSL.  
10. **Plan for spaced repetition logic** — Without a defined “learning cycle”, Initiation can’t auto-schedule repeats; spec requires this for v1 learning loop.

## PR plan
- **PR-A (critical bugs)**
  1. Replace all remaining UTC todayKey usages with `lib/time/todayKey.ts`; add DST tests.  
  2. Persist initiation facts to Firestore + hook them into `useProgressFacts` without overriding remote data.  
  3. Add Jest/node tests verifying plan reuse + runId idempotence.

- **PR-B (UX finishing)**
  1. Add subtle production copy when mindpacing falls back (non-intrusive toast).  
  2. Polish Today/Progress copy to hide internal IDs, ensure module names come from copy deck.  
  3. Add optional debug query to show fallback banner instead of env-only.

- **PR-C (learning stabilization – spaced repetition v1)**
  1. Define initiation module spacing rules (e.g., cooldown after completion).  
  2. Track lesson attempts/outcomes server-side to power repetition scheduling.  
  3. Integrate simple spaced repetition selector before plan generation.

## Term table
| Term | Defined in doc | Where used | Drift |
| --- | --- | --- | --- |
| World (INITIATION/PERFORMING/MASTERING) | `DOCS/ARCHITECTURE/omnimental-taxonomy-v1.md` §1.1 | `lib/taxonomy/types.ts`, `components/today/TodayOrchestrator.tsx`, Flow Studio metadata | No |
| Zone (PUBLIC/INTRO/…/ADMIN) | `DOCS/ARCHITECTURE/omnimental-taxonomy-v1.md` §1.2 | `config/taxonomy/zones.ts`, Flow Studio UI labels | No |
| Session vs Lesson vs Module | `world-initiation-spec.md` §2 | `lib/sessions/buildInitiationSessionPlan.ts`, `config/content/initiations/*.ts` | No |
| Step vs Screen | `world-initiation-spec.md` §2.2 (implied) | Flow Studio runtimes, StepRunner naming | **Yes – docs/code conflate** |
| Mindpacing tag | `world-initiation-spec.md` §6 | `lib/mindpacing/moduleMapping.ts`, `components/today/TodayOrchestrator.tsx` | No |

## UX risks (<=8 bullets)
- Today still shows “Inițiere · World 1” (internal wording); replace with user language (“Inițiere – Modul curent”).  
- Mindpacing fallback has no user-facing note in production; users may see unexpected modules without explanation.  
- Lesson list debug UI is hidden in prod, so support lacks direct visibility unless telemetry is inspected.  
- Plan rebuild errors silently log to console; user sees “Se pregătește planul…” indefinitely if builder throws.  
- Progress initiation card relies on local storage only; switching devices shows “No data yet”, confusing returning users.  
- Deep loop CTA assumes Earn credits even when Initiation isn’t available; gracefully hide until credits exist.  
- Reset button available only in dev/e2e — add guard to prevent accidental use in shared preview builds.  
- No spaced repetition cues on Today; users might binge multiple lessons in a row with no guidance.

## Launch readiness (5 bullets)
- **Blockers (must fix)**: UTC todayKey in daily reset/streak logic; absence of remote initiation facts; lack of plan locking tests.  
- **Postpone OK**: Production banner for mindpacing fallback, user-facing copy polish, debug UI cleanliness.  
- **Fragile/high-risk areas**: Plan storage generalisation (other worlds), spaced repetition logic (not started), Step vs Screen ambiguity.  
- **Learning loop gap**: Need basic spaced repetition (cooldowns, lesson queue, telemetry) to satisfy spec’s “familiarization” metric.  
- **Smallest next cycle**: PR-A bugfixes (todayKey, facts persistence, tests) followed by PR-B UX polish, then PR-C learning logic.

## Doc deltas
1. In `omnimental-taxonomy-v1.md` add a short subsection clarifying Step vs Screen definitions and when to use each in authoring.  
2. In `world-initiation-spec.md` §2, explicitly state that StepRunner nodes map to individual screens today and note future multi-step support.  
3. Append a troubleshooting note describing mindpacing fallback reasons and the telemetry event schema.
