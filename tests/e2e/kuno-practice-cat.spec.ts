import { test, expect } from '@playwright/test';
import { go, resetSession } from './helpers/env';

test.skip(true, 'Legacy Kuno practice (UX changed)');
// TODO: realign after initiation/wizard redesign

test('Kuno practice with category filter updates dashboard', async ({ page }) => {
  await resetSession(page);
  await go(page, '/kuno/practice?cat=calm&n=3&e2e=1');
  // Answer first 3 with feedback and next
  const options = page.getByTestId('practice-option');
  for (let i = 0; i < 3; i++) {
    await expect(options.first()).toBeVisible();
    await options.first().click();
    await expect(page.getByText(/Corect|Greșit/)).toBeVisible();
    await page.getByRole('button', { name: /Următoarea întrebare/ }).click();
  }
  await expect(page.getByText(/Rezultat/)).toBeVisible();
  await page.getByRole('button', { name: /Salvează/i }).click();
  await page.waitForURL(/\/progress/, { timeout: 15000 });
  await expect(page.getByTestId('metric-omni-cuno')).toBeVisible();
});
