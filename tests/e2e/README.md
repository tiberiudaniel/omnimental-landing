E2E tests for OmniMental (Playwright)

Run locally
- Terminal A: start the dev server
  - npm run dev
- Terminal B: run tests against http://localhost:3000
  - Install Playwright once: npx playwright install
  - Run: npm run test:e2e
  - UI mode (optional): npm run test:e2e:ui

Notes
- Tests assume demo routes exist so no auth is required:
  - /progress?demo=1|2|3
  - /recommendation?demo=1
- Base URL can be overridden with E2E_BASE_URL env.

