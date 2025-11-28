# QA — Wizard & Results Findings (Manual + E2E-assisted)

Scope: First‑time users (20 simulated) moving through Wizard → Recommendation → Progress. Reviewed copy, layout (1024 / 1280 / 1366 / 1440), Next/Back behavior, and recovery when users don’t select options, refresh, or change answers mid‑flow.

## Summary
- Overall flow works; selections and step validation prevent accidental advance.
- A few clarity gaps (microcopy around disabled actions), some responsive polish opportunities, and a couple of edge behaviors worth tightening.

## Findings

### [UX] Clarity / Copy
- [ ] Intent Cloud: when <5 selections, Continue is disabled but the instruction can be missed. Add a short helper under the button: “Selectează 5–7 opțiuni pentru a continua.” (EN: “Pick 5–7 options to continue.”)
- [ ] Summary steps: when Next is disabled (no choice yet), show a small hint near the button: “Completează selecțiile marcate.” (EN: “Complete the marked selections.”)
- [ ] Speed labels (Zile / Săptămâni / Luni): add a one‑liner explaining impact (e.g., “Ritmul influențează recomandarea de program și așteptările de progres.”)
- [ ] Budget labels: add example ranges (or tooltip) to align expectations (e.g., “Buget minim ≈ opțiuni gratuite / low‑touch”).
- [ ] Recommendation lead‑in: ensure the first sentence summarizes main theme + urgency + pace + budget in plain language (consistent with summary sentence already present).
- [ ] Dashboard Insight card: translate “Theme:” label to “Temă:” in RO to keep tone consistent.
- [ ] Weekly Trends: add a tiny sub‑legend clarifying metric (already shows “Minute/Sesiuni” below the chart — keep consistent across views).

### [UI] Layout / Responsiveness
- [ ] 1024/1280: Wizard content cards occasionally feel cramped; bump inner padding on summary card headers by 2–4px to prevent wrap on long labels.
- [ ] 1366/1440: Stepper dots + label shift slightly; align baseline with section header (flex alignment tweak).
- [ ] Intent Cloud: long labels may wrap and change chip height; ensure vertical rhythm remains consistent (min‑height on chips).
- [ ] Summary buttons: on hover the border/thickness change can shift layout; set fixed border width in both states.
- [ ] Dashboard chart SVG has fixed height; on 1440 consider 150–180px height for better readability.

### [BUG] Behavior / Consistency
- [ ] Dev/QA: Firestore writes from Intent Cloud can emit 4xx in environments without permissions (fixed in tests by disabling writes). Add a visible “Demo/QA: scrierile sunt dezactivate” banner in dev.
- [ ] Back navigation: after returning from Step 1 to Step 0 and changing values, ensure Step 1 preserved highlights reflect the last confirmed choice; persist local wizard state immediately on selection.
- [ ] Disabled Next jitter: rare case when user clicks quickly — debounce Next state updates to avoid fleeting enabled/disabled flicker.
- [ ] Onboarding (demo no‑auth): Experience step tries to save to profile; in demo/guest, treat this as local‑only (skip Firestore) and show a non‑blocking toast.
- [ ] Progress demo without profile: fixed to render demo facts; ensure CTA buttons route to demo‑capable targets.

## Actionable Checklist
- [ ] Add helper text under Intent Cloud Continue when disabled (<5 selections).
- [ ] Add sticky hint near Next button when disabled on Summary steps.
- [ ] Add one‑line explanations for speed and budget (tooltip or inline microcopy).
- [ ] Fix hover border‑width to avoid layout shift on buttons.
- [ ] Increase Weekly Trends height to 150–180px at ≥1366px width.
- [ ] Persist step selections optimistically for Back/Forward consistency.
- [ ] Add dev banner when NEXT_PUBLIC_DISABLE_PROGRESS_WRITES=1.
- [ ] Translate “Theme:” to “Temă:” in RO on the Insight card.
- [ ] Add min‑height to Intent Cloud chips to avoid uneven rows on long labels.
- [ ] Debounce Next/Back handlers to prevent double‑activation.

## Notes
- E2E suites were updated to use stable data‑testids and to disable writes in QA.
- Consider adding Firebase Emulators for full auth/db E2E in CI later.

