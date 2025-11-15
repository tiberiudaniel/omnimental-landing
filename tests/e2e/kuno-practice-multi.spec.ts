import { test, expect } from '@playwright/test';

const cats = [
  { key: 'calm', label: 'Calm' },
  { key: 'energie', label: 'Energie' },
  { key: 'performanta', label: 'Performanță' },
  { key: 'general', label: 'General' },
];

for (const c of cats) {
  test(`practice adaptive: ${c.key}`, async ({ page }) => {
    await page.goto(`/kuno/practice?cat=${encodeURIComponent(c.key)}&n=3&e2e=1`);
    for (let i = 0; i < 3; i++) {
      await expect(page.getByRole('button').first()).toBeVisible();
      await page.getByRole('button').first().click();
      await expect(page.getByText(/Corect|Greșit/)).toBeVisible();
      await page.getByRole('button', { name: /Următoarea întrebare/ }).click();
    }
    await expect(page.getByText(/Rezultat/)).toBeVisible();
    await page.getByRole('button', { name: /Salvează/i }).click();
    await expect(page).toHaveURL(/\/progress/);
  });
}
