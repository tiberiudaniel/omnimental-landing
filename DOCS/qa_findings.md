QA Findings — OmniMental Wizard & Dashboard (E2E-driven)

Coverage summary
- Covered well (via E2E):
  - Intent Cloud selection (min/max selections enforced)
  - Summary steps: urgency, speed (Zile/Săptămâni/Luni), determination, weekly time, budget, goal type, emotional state
  - Recommendation screen with both CTA cards (individual/group)
  - Dashboard demo: trend title Day/Week • Minutes/Sessions, numeric labels above bars, insight and quest cards

- Missing/now added (edge cases):
  - Attempting to continue from intent with <5 selections (button disabled)
  - Going back and changing answers mid-way
  - Extreme inputs (urgency 10, budget min, etc.) always lead to a valid recommendation

UX issues and proposals
1) Intent Cloud continue disabled without a visible hint
   - Issue: When <5 selections, the Continue button is disabled; users may not see clearly what to do next.
   - Proposal: Always render a helper text beneath the button: “Selectează 5–7 opțiuni pentru a continua.” (RO) / “Pick 5–7 options to continue.” (EN). Currently we show a 0–100% indicator; adding the sentence near the button will remove ambiguity.

2) Step validation messaging consistency
   - Issue: On summary steps, we show “Selectează o opțiune” under unselected groups, but the Next label changes to “Pasul următor” which can be pressed only after selection; good pattern, but could be more explicit.
   - Proposal: Disable Next until required choices are selected (already done) and complement with a sticky microcopy on the right of the Next button: “Completează selecțiile marcate” when disabled.

3) Back navigation and persistence
   - Observation: Going back from Step 1 to Step 0 and changing choices works; sometimes Step 1 highlights aren’t preserved if not yet confirmed.
   - Proposal: Persist temporary selections per step immediately (optimistic save in local wizard state) and visually mark previously chosen options on return.

4) Console errors in test/demo mode
   - Issue: Firestore writes caused console errors during tests (“Missing or insufficient permissions”).
   - Resolution: We now guard writes with NEXT_PUBLIC_DISABLE_PROGRESS_WRITES and log warnings instead. Keep this for QA/dev.
   - Proposal: Add a visible banner in dev/test that says “Demo/QA mode: writes disabled” to avoid confusion.

5) Data-testids for critical actions
   - Issue: Initial tests relied on localized text like “Continuă”. This is brittle.
   - Resolution: Added data-testid hooks (wizard-continue, wizard-next, wizard-step-intent, wizard-step-summary, card-individual, card-group). Continue to adopt testids for other critical buttons.

6) Dashboard title clarity
   - Observation: Title updates to “Trend săptămânal — Azi/Săptămână • Minute/Sesiuni”; good clarity.
   - Proposal: Add a tiny legend line under the title: “Valorile sunt pe zi; barele arată volumul zilnic.” (already partially present; ensure consistency for both Minutes and Sessions.)

7) Quest title fallback
   - Observation: When quest has no specific title, the card uses “Provocarea de azi”. Now robust.
   - Proposal: If the quest body is also empty, show a placeholder sentence with a CTA (e.g., “Deschide Antrenament pentru a genera o provocare.”)

Next steps
- Add testids for other steps and buttons (goal, emotional, budget) and update tests to use them for further stability.
- Add unit tests for lib/dashboardMetrics and lib/progressAnalytics.
- Consider Firebase emulators for live auth/db flows in CI.

