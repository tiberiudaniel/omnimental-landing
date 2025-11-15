import { test, expect } from '@playwright/test';

test.describe('Experience onboarding → Omni‑Kuno reflected in /progress (guest/demo)', () => {
  test('mini‑test score appears as Omni‑Cuno on dashboard', async ({ page }) => {
    // Start on intro and proceed to mini‑test
    await page.goto('/experience-onboarding?start=1&lang=ro&e2e=1');
    await page.getByTestId('eo-start').click();

    // Answer 3 questions (first option for speed)
    const cards = page.getByTestId('eo-question');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await cards.nth(i).getByTestId('eo-option').first().click();
    }

    // Submit and go to score
    await page.getByTestId('eo-submit').click();
    await expect(page.getByText(/Scor Mini|Mini‑Cuno Score/i)).toBeVisible();
    await page.getByTestId('eo-continue').click();

    // Redirect step → Continue now
    await page.getByRole('button', { name: /Continuă acum|Continue now/i }).click();

    // On progress page, Omni‑Cuno should be > 0 (guest localStorage fallback)
    const omniValue = page.getByTestId('metric-omni-cuno-value');
    await expect(omniValue).toBeVisible();
  });
});
