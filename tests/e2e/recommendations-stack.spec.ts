import { test, expect } from '@playwright/test';

test.describe.skip('Recommendations stack (legacy, UX changed)', () => {
  // TODO: realign after initiation/wizard redesign
  test('seed and render stack + details', async ({ page }) => {
    // Seed sample recommendations (dev-only helper)
    await page.goto('/admin/seed-recommendations');
    // Seed button
    await expect(page.getByRole('button', { name: /Seed now/i })).toBeVisible();
    await page.getByRole('button', { name: /Seed now/i }).click();
    // Navigate to Recommendations
    await page.getByRole('button', { name: /Open Recommendations/i }).click();

    // Verify page scaffold loaded
    await expect(page.getByTestId('recommendation-step')).toBeVisible();

    // Ensure stack section is present (temporary debug marker or section contents)
    const debug = page.getByTestId('debug-reco');
    await expect(debug).toBeVisible({ timeout: 10000 });
    await expect(debug.getByText(/RECOMMENDATION STACK SECTION ACTIVE/i)).toBeVisible();

    // Filters visible
    await expect(page.getByRole('button', { name: /Toate|All/i })).toBeVisible();

    // Expect at least one stacked card title visible
    // We look for the seeded sample short labels or titles
    await expect(page.getByText(/Somn|sleep|Mindset|focus/i)).toBeVisible();

    // Click a stack card by its short label
    const targetCard = page.getByText(/Mindset|calm/i).first();
    await targetCard.click();

    // Verify detail panel shows body and an action button
    await expect(page.getByRole('link', { name: /Deschide|Open/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Marchează finalizat|Mark as done/i })).toBeVisible();
  });
});

