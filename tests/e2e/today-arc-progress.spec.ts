import { test, expect } from '@playwright/test';
import { go, resetSession } from './helpers/env';

function guardConsole(page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (/Download the React DevTools/.test(text)) return;
      throw new Error(`Console error: ${text}`);
    }
  });
}

test.describe('Today arc progress', () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
    guardConsole(page);
  });

  test('simulated days show up in Today arc progress label', async ({ page }) => {
    await go(page, '/admin/v4-debug');
    await page.waitForSelector('input#sim-days', { timeout: 15000 });
    await page.fill('input#sim-days', '3');
    const simulateBtn = page.getByRole('button', { name: /simulează progres/i });
    await simulateBtn.click();
    await expect(simulateBtn).toBeDisabled({ timeout: 1000 });
    await expect(simulateBtn).not.toBeDisabled({ timeout: 30000 });
    await expect(page.getByText(/Timeline zilnic/i)).toBeVisible({ timeout: 20000 });

    await go(page, '/today');
    await expect(page.getByText(/Ziua /i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Sesiunea zilnică recomandată/i)).toBeVisible();
  });
});
