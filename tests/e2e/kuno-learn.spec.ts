import { test, expect } from '@playwright/test';

test.describe('Kuno Learn micro-lesson', () => {
  test('user starts a lesson, completes micro-quiz, and reaches progress', async ({ page }) => {
    await page.goto('/kuno/learn?cat=clarity&e2e=1');
    // Heading may vary; assert the page structure rather than exact title
    await expect(page.locator('h1').first()).toBeVisible();
    await page.getByTestId('learn-start').click();
    // Start lesson if needed, then answer 3 questions quickly
    const start = page.getByTestId('learn-start');
    if (await start.isVisible().catch(() => false)) {
      await start.click();
    }
    for (let i = 0; i < 3; i++) {
      await expect(page.getByTestId('learn-option').first()).toBeVisible();
      await page.getByTestId('learn-option').first().click();
    }
    await expect(page.getByText(/Rezultat micro/i)).toBeVisible();
    await page.getByTestId('learn-finish').click();
    await page.waitForURL(/\/progress/, { timeout: 15000 });
    await expect(page.getByText(/Omni-Cuno/i)).toBeVisible();
  });
});
