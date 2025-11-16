import { test, expect, type Page } from '@playwright/test';
import { go, resetSession } from './helpers/env';

async function readReflectionsCount(page: Page) {
  // Find the metric tile that contains the label 'Reflections', then read the following number
  const tile = page.locator('div', { has: page.getByText('Reflections') }).first();
  await expect(tile).toBeVisible();
  // The numeric value is the second <p> inside our Metric tile
  const numText = await tile.locator('p').nth(1).innerText();
  const match = numText.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

test.describe('Dashboard data flow (journal + Kuno)', () => {
  test('writes journal → reflections + recent entries; completes lesson → Omni Kuno > 0', async ({ page }) => {
    await resetSession(page);
    // Open progress in e2e mode (header/auth overlays suppressed)
    await go(page, '/progress?e2e=1&lang=ro');

    // Read initial Reflections
    const beforeRef = await readReflectionsCount(page).catch(() => 0);

    // Open journal drawer directly, write a short note, close to trigger save
    await go(page, '/progress?e2e=1&open=journal&lang=ro');
    const ta = page.locator('textarea');
    await expect(ta.first()).toBeVisible();
    await ta.first().fill('Test jurnal — verificare reflections');
    // Close via stable testId to avoid strict-mode ambiguity
    await page.getByTestId('journal-close').click();

    // Back to progress and verify updates
    await go(page, '/progress?e2e=1&lang=ro');
    const afterRef = await readReflectionsCount(page).catch(() => 0);
    expect(afterRef).toBeGreaterThanOrEqual(beforeRef);

    // Recent entries should show at least one item now
    await expect(page.getByText(/Însemnări recente|Recent Entries/)).toBeVisible();
    // A simple heuristic: there should be at least one timestamp or the text we entered
    await expect(page.getByText(/Test jurnal/i)).toBeVisible();

    // Complete a quick Kuno lesson (clarity) and save
    await go(page, '/kuno/learn/clarity-1?cat=clarity&e2e=1');
    // If lesson auto-starts, the options are visible; otherwise click start on list page
    const startBtn = page.getByTestId('learn-start');
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
    }
    for (let i = 0; i < 3; i++) {
      await expect(page.getByTestId('learn-option').first()).toBeVisible();
      await page.getByTestId('learn-option').first().click();
    }
    const finish = page.getByTestId('learn-finish');
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
    }

    // Verify Omni Kuno tile shows a number > 0
    await go(page, '/progress?e2e=1&lang=ro');
    const kunoTile = page.getByTestId('metric-omni-cuno');
    await expect(kunoTile).toBeVisible();
    const kunoText = await kunoTile.innerText();
    const num = parseInt((kunoText.match(/\d+/) || ['0'])[0], 10);
    expect(num).toBeGreaterThan(0);
  });
});
