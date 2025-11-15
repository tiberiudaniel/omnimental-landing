import { test, expect } from '@playwright/test';

test.describe('Onboarding flow (RO, demo)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text() || '';
        if (/Failed to load resource/i.test(text) || /status of 4\d\d/i.test(text)) return;
        throw new Error(`Console error: ${text}`);
      }
    });
  });

  test('intro → self‑assessment → mini‑cuno → recommendation (with optional experience step)', async ({ page }) => {
    // Intro
    await page.goto('/onboarding?demo=1&lang=ro&e2e=1');
    // Pick the first choice via testid and continue
    await expect(page.getByTestId('onboarding-intro')).toBeVisible();
    await page.getByTestId('onboarding-choice-calm_clarity').click();
    await page.getByTestId('onboarding-continue').click();

    // Self‑assessment: set each slider to a mid/high value and continue
    const sliders = page.locator('input[type="range"]');
    const count = await sliders.count();
    for (let i = 0; i < count; i++) {
      await sliders.nth(i).evaluate((el) => { (el as HTMLInputElement).value = '7'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    }
    await page.getByTestId('onboarding-self-continue').click();

    // Mini‑Cuno: answer each question (click first option for each) and save
    const questionBlocks = page.locator('article');
    const qCount = await questionBlocks.count();
    for (let i = 0; i < qCount; i++) {
      const firstOption = questionBlocks.nth(i).locator('button').first();
      await firstOption.click();
    }
    await page.getByTestId('onboarding-minicuno-save').click();
    // Wait explicitly for recommendation step
    await page.waitForSelector('[data-testid="recommendation-step"]', { timeout: 15000 });

    // Optional Experience step (only for member profiles). If present, select 1–2 chips and continue.
    const expTitle = page.getByText(/Hai să vedem cum ar fi|Let’s see how/i);
    if (await expTitle.isVisible()) {
      const chips = page.locator('button', { hasText: /claritate|emoție calmă|motivație|idee|apartenență|exercițiu|feedback/i });
      if (await chips.count()) {
        await chips.first().click();
        await page.getByRole('button', { name: /Continuă/i }).click();
      }
    }

    // Final assert: recommendation still visible and no UI error strings
    await expect(page.getByText(/Recomandare:/i)).toBeVisible();
    await expect(page.getByText(/Nu am putut|eroare|error/i)).toHaveCount(0);
  });
});
