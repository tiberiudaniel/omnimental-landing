E2E tests for OmniMental (Playwright)

Run locally
- Terminal A: start the dev server
  - npm run dev
- Terminal B: run tests against http://localhost:3000
  - Install Playwright once: npx playwright install
  - Run: npm run test:e2e (smoke suite only)
  - UI mode (optional): npm run test:e2e:ui

Notes
- Playwright needs Node.js 18+; if the active runtime is older you can point `NODE18_BIN` at the desired binary and the helper script will use it for the test run.
- Heavy wizard suites (`wizard-fuzz`, `wizard-multiple-users`) are skipped by default; set `RUN_HEAVY_WIZARD=1` when you want to include them.
- Tests assume demo routes exist so no auth is required:
  - /progress?demo=1|2|3
  - /recommendation?demo=1
- Base URL can be overridden with E2E_BASE_URL env.

