import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: 0,
  webServer: {
    command: process.env.E2E_WEB_COMMAND || 'npm run dev',
    url: process.env.E2E_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_DISABLE_PROGRESS_WRITES: '1',
      // Make demo switcher optional; tests use routes that don't depend on it
      NEXT_PUBLIC_ENABLE_DEMOS: process.env.NEXT_PUBLIC_ENABLE_DEMOS || '1',
    },
  },
  /* Run your local dev server separately: `npm run dev` */
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
