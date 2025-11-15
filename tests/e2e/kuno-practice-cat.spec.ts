import { test, expect } from '@playwright/test';

test('Kuno practice with category filter updates dashboard', async ({ page }) => {
  await page.goto('/kuno/practice?cat=calm&n=3&e2e=1');
  // Answer first 3 with feedback and next
  for (let i = 0; i < 3; i++) {
    await expect(page.getByRole('button').first()).toBeVisible();
    await page.getByRole('button').first().click();
    await expect(page.getByText(/Corect|Greșit/)).toBeVisible();
    await page.getByRole('button', { name: /Următoarea întrebare/ }).click();
  }
  await expect(page.getByText(/Rezultat/)).toBeVisible();
  await page.getByRole('button', { name: /Salvează/i }).click();
  await page.waitForURL(/\/progress/, { timeout: 15000 });
  await expect(page.getByTestId('metric-omni-cuno')).toBeVisible();
});
