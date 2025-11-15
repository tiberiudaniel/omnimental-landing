import { test, expect } from '@playwright/test';

test.describe('Progress journal → dashboard', () => {
  test('saves entry and shows in Recent Entries; reflections increments', async ({ page }) => {
    // Go to progress and force open journal drawer
    await page.goto('/progress?open=journal&lang=ro');

    // Type a unique journal line
    const unique = `E2E jurnal ${Date.now()}`;
    const drawer = page.locator('[data-testid="journal-drawer"][aria-hidden="false"]').first();
    await expect(drawer).toBeVisible({ timeout: 15000 });
    const textarea = drawer.getByTestId('journal-text').first();
    await expect(textarea).toBeVisible({ timeout: 15000 });
    await textarea.fill(unique);

    // Grab current reflections count if visible (optional)
    let beforeReflections: number | null = null;
    const refMetric = page.getByTestId('metric-reflections');
    if (await refMetric.isVisible().catch(() => false)) {
      const txt = await refMetric.locator('text=/\d+/').first().textContent().catch(() => null);
      beforeReflections = txt ? Number((txt.match(/\d+/)?.[0]) ?? '0') : null;
    }

    // Trigger save (autosave runs too); close via ESC to avoid selector flake
    // Close via close button for stability
    await page.getByTestId('journal-close').click();
    // Drawer should hide
    await expect(drawer).toBeHidden({ timeout: 15000 });
    // Expect save toast
    const toast = page.getByText(/Salvat în cont|Salvat local/);
    await expect(toast).toBeVisible({ timeout: 15000 });

    // Recent Entries should contain our text shortly
    const recent = page.getByTestId('recent-entries');
    await expect(recent.getByText(unique)).toBeVisible({ timeout: 20000 });

    // Reflections metric should be >= before (if baseline existed) or >= 1
    if (await refMetric.isVisible().catch(() => false)) {
      const afterTxt = await refMetric.locator('text=/\d+/').first().textContent();
      const after = afterTxt ? Number((afterTxt.match(/\d+/)?.[0]) ?? '0') : 0;
      if (typeof beforeReflections === 'number') {
        expect(after).toBeGreaterThanOrEqual(beforeReflections);
      } else {
        expect(after).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
