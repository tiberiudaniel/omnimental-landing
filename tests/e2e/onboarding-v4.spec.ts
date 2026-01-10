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

test.describe('Onboarding v4 flow', () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
    guardConsole(page);
  });

  test('user completes onboarding and lands on Today', async ({ page }) => {
    await go(page, '/onboarding?step=cat-lite&e2e=1');

    const sliders = page.locator('[data-testid^="cat-lite-slider-"]');
    const sliderCount = await sliders.count();
    for (let i = 0; i < sliderCount; i += 1) {
      const slider = sliders.nth(i);
      await slider.waitFor({ state: 'visible', timeout: 15000 });
      await slider.evaluate((el) => {
        (el as HTMLInputElement).value = '7';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    await page.getByTestId('cat-lite-continue').click();

    await page.getByTestId('stroop-start').click();
    for (let i = 0; i < 36; i += 1) {
      const colorIndex = i % 4;
      const colorTestIds = ['stroop-color-red', 'stroop-color-green', 'stroop-color-blue', 'stroop-color-yellow'];
      await page.getByTestId(colorTestIds[colorIndex]).click();
    }
    await page.getByTestId('stroop-complete').click();

    // WOW lesson
    const contextOption = page.locator('button').filter({ hasText: /Rar|Din când|Foarte des/i }).first();
    await contextOption.click();
    await page.getByRole('button', { name: /continuă/i }).first().click();
    await page.getByRole('button', { name: /gata/i }).click();
    await page.locator('textarea').fill('E2E reflection');
    await page.getByRole('button', { name: /prea ușor|potrivit|prea greu/i }).first().click();
    await page.getByRole('button', { name: /finalizează/i }).click();

    await page.getByRole('button', { name: /mergi la \/today/i }).click();
    await expect(page).toHaveURL(/\/today/);
    await expect(page.getByText(/Sesiunea zilnică recomandată/i)).toBeVisible({ timeout: 20000 });
  });
});
