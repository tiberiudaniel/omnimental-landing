import { test, expect } from '@playwright/test';
import { go, resetSession } from './helpers/env';

const FORBIDDEN_ON_RUN = [
  /Foundation Cycle/i,
  /Checkpoint săptămânal/i,
  /Brieful de misiune/i,
  /Quest map/i,
  /DailyPath QA Links/i,
  /Calibration Mission/i,
];

test.describe('Guided Day1 contract (lane UI)', () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
  });

  test('Guided Day1 run does NOT render Foundation shell / Brief selector / Quest map; Save Progress is NOT shown at start', async ({
    page,
  }) => {
    await go(page, '/today?source=guided_day1');
    await expect(page.getByTestId('guided-day1-hero')).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('guided-day1-start').click();
    await expect(page).toHaveURL(/\/today\/run\?.*source=guided_day1/i, { timeout: 20_000 });

    await expect(page.locator('body')).toContainText(/OmniMental/i, { timeout: 20_000 });

    for (const pattern of FORBIDDEN_ON_RUN) {
      await expect(page.getByText(pattern)).toHaveCount(0);
    }

    await expect(page.getByText(/Salvează-ți progresul/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Creează cont/i })).toHaveCount(0);
  });

  test('Session Complete (Guided Day1): Save Progress is shown and can be dismissed (sticky)', async ({ page }) => {
    await resetSession(page);
    await go(page, '/today?source=guided_day1&e2e=1');
    await expect(page.getByTestId('guided-day1-hero')).toBeVisible({ timeout: 20_000 });
    await go(page, '/session/complete?source=guided_day1&lane=guided_day1&e2e=1');
    await expect(page).toHaveURL(/\/session\/complete/i, { timeout: 20_000 });
    await expect(page.getByTestId('guided-day1-summary-root')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('guided-day1-summary-continue')).toBeVisible();
    await expect(page.getByTestId('guided-day1-summary-back')).toBeVisible();
    await expect(page.getByTestId('save-progress-card')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('save-progress-create')).toBeVisible();
    await expect(page.getByTestId('save-progress-dismiss')).toBeVisible();
    await page.getByTestId('save-progress-dismiss').click();
    await expect(page.getByTestId('save-progress-card')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('guided-day1-summary-root')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('save-progress-card')).toHaveCount(0);
  });
});
