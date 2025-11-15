import { test, expect } from '@playwright/test';

test.describe('Experience Onboarding (RO)', () => {
  test('mini-test → score → progress highlight', async ({ page }) => {
    await page.goto('/experience-onboarding?start=1&lang=ro');

    // Intro
    await page.getByTestId('eo-start').click();

    // Answer 3 questions by selecting the first option for each, using testids
    const cards = page.getByTestId('eo-question');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    for (let i = 0; i < Math.min(3, count); i++) {
      await cards.nth(i).getByTestId('eo-option').first().click();
    }

    // Submit
    await page.getByTestId('eo-submit').click();

    // Score visible
    await expect(page.getByText(/Scor Mini/i)).toBeVisible();
    await page.getByTestId('eo-continue').click();
    // Redirect step renders; click Continue now
    await page.getByRole('button', { name: /Continuă acum|Continue now/i }).click();
    // Landing on progress with test highlight
    await expect(page).toHaveURL(/progress/);
    await expect(page.getByText(/Ai completat primul tău test/i)).toBeVisible();
  });
});
