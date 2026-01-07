npm run sync:flowdoc-day1
npm run verify:flowdoc-stepmanifests
node scripts/run-playwright.mjs tests/e2e/journeys-explore-cat-day1.spec.ts
node scripts/run-playwright.mjs tests/e2e/journeys-from-flowstudio.spec.ts