import { test, expect, Page } from '@playwright/test';
import { go, resetSession } from './helpers/env';

function guardConsole(page: Page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (/Download the React DevTools/.test(text)) return;
      throw new Error(`Console error: ${text}`);
    }
  });
}

async function completeStroopRun(page: Page) {
  await page.getByTestId('stroop-start').click();
  const colors = ['stroop-color-red', 'stroop-color-green', 'stroop-color-blue', 'stroop-color-yellow'];
  for (let i = 0; i < 36; i += 1) {
    await page.getByTestId(colors[i % colors.length]).click();
  }
  await page.getByTestId('stroop-complete').click();
}

test.describe('Arena gating', () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
    guardConsole(page);
  });

  test('free user is gated after first arena run', async ({ page }) => {
    await go(page, '/arenas');
    await page.getByRole('link', { name: /începe/i }).first().click();
    await completeStroopRun(page);
    await expect(page).toHaveURL(/\/arenas/);

    // Second run triggers gating
    await page.getByRole('link', { name: /începe/i }).first().click();
    await expect(
      page.getByText(/Ai folosit runda gratuită pentru această Arenă/i),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /Upgrade/i })).toBeVisible();
  });
});
