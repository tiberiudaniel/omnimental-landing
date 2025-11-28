import { test, expect, type Page } from '@playwright/test';
import { go, resetSession } from './helpers/env';

async function readReflectionsCount(page: Page) {
  const tile = page.locator('div', { has: page.getByText('Reflections') }).first();
  await expect(tile).toBeVisible();
  const numText = await tile.locator('p').nth(1).innerText();
  const match = numText.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

test.describe.skip('Progress persistence (legacy, UX changed)', () => {
  // TODO: realign after initiation/wizard redesign
  test('activity persists across browser context (returning user)', async ({ page, browser }, testInfo) => {
    // Phase A: create activity and verify on /progress
    await resetSession(page);
    await go(page, '/progress?lang=ro');

    const unique = `E2E persist ${Date.now()}`;
    const beforeRef = await readReflectionsCount(page).catch(() => 0);

    // Open journal drawer and save a note
    await go(page, '/progress?open=journal&lang=ro');
    const drawer = page.locator('[data-testid="journal-drawer"][aria-hidden="false"]').first();
    await expect(drawer).toBeVisible({ timeout: 15000 });
    const textarea = drawer.getByTestId('journal-text').first();
    await expect(textarea).toBeVisible({ timeout: 15000 });
    await textarea.fill(unique);
    // Brief debounce; closing will trigger blur/autosave handlers
    await page.waitForTimeout(250);
    await drawer.getByTestId('journal-close').click();

    // Back to progress; verify reflections and recent entries
    // Switch to normal route so real profile branch renders (not demo fallback)
    await go(page, '/progress?lang=ro');
    const afterRef = await readReflectionsCount(page).catch(() => 0);
    expect(afterRef).toBeGreaterThanOrEqual(beforeRef);
    const recentBox = page.getByTestId('recent-entries');
    await expect(recentBox).toBeVisible({ timeout: 20000 });
    await expect(recentBox.getByText(unique)).toBeVisible({ timeout: 30000 });

    // Trends should show at least one numeric value
    const anyNumber = page.getByTestId('trends-chart').locator('svg text').filter({ hasText: /\d+/ });
    await expect(anyNumber.first()).toBeVisible();

    // Persist auth/session state to simulate returning user with same account
    const storagePath = testInfo.outputPath('persist-storage.json');
    await page.context().storageState({ path: storagePath });

    // Phase B: new context (simulated fresh browser), restored session
    await page.context().close();
    const ctx = await browser.newContext({ storageState: storagePath });
    const page2 = await ctx.newPage();

    // Go directly to /progress and verify data persists
    await go(page2, '/progress?lang=ro');
    const refCount = await readReflectionsCount(page2).catch(() => 0);
    expect(refCount).toBeGreaterThan(0);
    await expect(page2.getByTestId('recent-entries').getByText(unique)).toBeVisible({ timeout: 20000 });

    // Trends still have numbers
    const anyNumber2 = page2.getByTestId('trends-chart').locator('svg text').filter({ hasText: /\d+/ });
    await expect(anyNumber2.first()).toBeVisible();

    await ctx.close();
  });
});
