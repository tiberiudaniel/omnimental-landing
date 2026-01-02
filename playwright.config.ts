import { defineConfig, devices } from '@playwright/test';

const webServer = process.env.PW_SKIP_WEBSERVER === '1' ? undefined : {
  command: process.env.E2E_WEB_COMMAND || 'npm run dev',
  url: process.env.E2E_BASE_URL || 'http://localhost:3000',
  reuseExistingServer: true,
  timeout: 120_000,
  env: {
    NEXT_PUBLIC_DISABLE_PROGRESS_WRITES: '1',
    NEXT_PUBLIC_ENABLE_DEMOS: process.env.NEXT_PUBLIC_ENABLE_DEMOS || '1',
  },
} as const;

const journeysSpecPattern = /journeys-from-flowstudio\.spec\.ts$/;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: 0,
  webServer,
  /* Run your local dev server separately: `npm run dev` */
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'journeys',
      testMatch: journeysSpecPattern,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'legacy',
      testIgnore: journeysSpecPattern,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
