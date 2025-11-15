OmniMental — Checkpoints

Date: 2025-11-13

Area: Onboarding & Testare (E2E)

- [x] Onboarding demo flow (intro → self‑assessment → mini‑cuno → recommendation) stabilizat și testat (tests/e2e/onboarding.spec.ts)
- [x] Adăugat data-testid-uri pentru wizard și onboarding (wizard-step-*, speed-*, budget-*, emo-*, onboarding-*)
- [x] Wizard: reflectare intermediară între intent → summary; tests actualizate
- [x] Playwright configurat (scripts + webServer) și comenzi:
  - `npm run test:e2e`, `npm run test:e2e:headed`, `npm run test:e2e:ui`
  - `npx playwright test -g "wizard-stress-test"`
- [x] Scenarii multi-user (10) și edge-cases implementate
- [x] Stress test (20 rulari randomizate) stabilizat
- [x] Dashboard demo & toggles testate (tests/e2e/progress.spec.ts)
- [x] Rezolvat erori de hidratare la /recommendation (citire cache în effect)
- [x] Header logo → `/?step=preIntro&reset=1`
- [x] “Acces Invitat Special” în SessionDetails (guest → `/recommendation?demo=1`)
- [ ] Banner QA când `NEXT_PUBLIC_DISABLE_PROGRESS_WRITES=1`
- [ ] Extinde acoperirea EN și /recommendation?demo 2/3

