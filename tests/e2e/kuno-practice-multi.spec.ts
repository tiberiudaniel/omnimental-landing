import { test, expect } from '@playwright/test';
import { go, resetSession } from './helpers/env';

const cats = [
  { key: 'calm', label: 'Calm' },
  { key: 'energie', label: 'Energie' },
  { key: 'performanta', label: 'Performanță' },
  { key: 'general', label: 'General' },
];

for (const c of cats) {
  test(`practice adaptive: ${c.key}`, async ({ page }) => {
    await resetSession(page);
    await go(page, `/kuno/practice?cat=${encodeURIComponent(c.key)}&n=3&e2e=1`);
    for (let i = 0; i < 3; i++) {
      await expect(page.getByRole('button').first()).toBeVisible();
      await page.getByRole('button').first().click();
      await expect(page.getByText(/Corect|Greșit/)).toBeVisible();
      await page.getByRole('button', { name: /Următoarea întrebare/ }).click();
    }
    await expect(page.getByText(/Rezultat/)).toBeVisible();
    await page.getByRole('button', { name: /Salvează/i }).click();
    await expect(page).toHaveURL(/\/progress/, { timeout: 20000 });
  });
}
