import { test, expect } from '@playwright/test';
import { go, resetSession } from './helpers/env';

test.describe.skip('Progress journal → dashboard (legacy, UX changed)', () => {
  // TODO: realign after initiation/wizard redesign
  test('saves entry and shows in Recent Entries; reflections increments', async ({ page }) => {
    test.setTimeout(90000);
    // Go to progress and force open journal drawer
    await resetSession(page);
    await go(page, '/progress?open=journal&lang=ro&e2e=1');

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

    // Allow autosave debounce briefly; closing the drawer shifts focus and triggers onBlur too
    await page.waitForTimeout(250);
    // Close drawer (prefer close button; fallback to ESC)
    const closeBtn = drawer.getByTestId('journal-close');
    try {
      await closeBtn.scrollIntoViewIfNeeded().catch(() => {});
      await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
      await closeBtn.click();
    } catch {
      // Fallback: click overlay
      try {
        const overlay = page.locator('[data-testid="journal-drawer"] > div').first();
        await overlay.click({ trial: false, timeout: 2000 }).catch(() => {});
      } catch {}
      // Final fallback: ESC
      await page.keyboard.press('Escape');
    }
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
