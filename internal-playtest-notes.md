# Internal Playtest Notes

## Flow Walkthrough (no debug tools)

1. **Onboarding – CAT Lite Part 1**
   - Accessible immediately after auth.
   - Requires answering 8 sliders before continue → reasonable entry step.
2. **Quick Task (Stroop)**
   - Now blocked until `completedDailySessions >= 1` (TodayOrchestrator facts).
   - Locked panel pushes user to `/today` ⇒ gating order respected.
3. **First Session (WowLesson)**
   - Runs in short mode; completion triggers new celebration screen (badge + “Mâine…”).
   - No branch loops; CTA returns to `/today`.
4. **Temple/Radar**
   - Also gated behind first daily completion; shows same locked panel until condition met.
5. **CAT Lite Part 2 + Style Profile**
   - Surfaced via cards on `/today` only when `getTotalDailySessionsCompleted >= 3`.
   - No alternative entry, so sequencing stays clean.
6. **Today Loop**
   - DailyPathRunner → celebration → manual return CTA (no forced redirect loops).
   - Free users still hit limit guard after one run; upgrade CTA + back CTA working.
7. **Wizard Access**
   - Requires `GATING.wizardMinDailySessions` (31). Locked view now shows progress meter + preview of features.
8. **OmniKuno (hub/practice/learn)**
   - Each page checks gating and displays progress bar, days remaining, and preview list.
   - After unlock the cards lead to /omni-kuno flows; no loops detected.

## Gating Correctness

- **Onboarding**: Quick Task & Temple conditional on `totalDailySessions >= 1` (no bypass). CAT Lite Part 2 surfaced via `needsCatLitePart2`, which checks both sessions ≥3 and missing axes.
- **Wizard**: unlocked only when `canAccessWizard` true → uses progress facts snapshot; locked copy references computed sessions.
- **OmniKuno**: hub, practice, learn all use `canAccessOmniKuno` (≥ GATING.omniKunoMinDailySessions). Locked states mirror the same requirement and no alternative navigation bypass exists.
- **Daily Loop**: Celebration screen still requires manual return, but `markDailyCompletion` is called before showing it, so gating counters are satisfied.

## Unlock Order Observations

- Order is now: CAT Lite Part 1 → `/today` first run → Quick Task & Temple → days 2-3 daily loop → CAT Lite Part 2 + Style → continued daily → Wizard/OmniKuno once thresholds met. No conflicting unlocks observed.
- OmniKuno requires 12 sessions (per `GATING.omniKunoMinDailySessions`); Wizard requires 31; gating copy reflects same numbers.

## Dead-loop Check

- Celebration view has single CTA to `/today?source=run_complete`, so user can’t get stuck; there is no “repeat session” path from there.
- Locked panels on onboarding redirect to `/today` only; no route loops back to locked step.
- Kuno/Wizard locked pages only link to `/today` or display information; no infinite redirects.

## Friction Notes (no fixes proposed)

- **Early Demand**: CAT Lite Part 1 still asks for 8 sliders before user sees any payoff; there’s no “skip for later”.
- **Post-first-session**: Temple remains locked even after first session until user returns to onboarding path; easy to miss if they stay on `/today`.
- **Celebration CTA**: User must tap “Revin mâine” to leave; no secondary option for “altă sesiune” or “revizualizează lecția”.
- **CAT Lite Part 2 Card**: Appears after 3 sessions but copy still reads like mandatory step; might feel like an extra chore.
- **Wizard Gate Copy**: Mentions 31 sessions but doesn’t show partial capability (still pure promise).
- **OmniKuno Preview**: Lists benefits but no actual sneak peek; could feel abstract until real unlock.
