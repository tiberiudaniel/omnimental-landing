import { test, expect } from '@playwright/test';
import { expectVisibleShort } from './helpers/diag';
import { go, resetSession } from './helpers/env';

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
    await resetSession(page);
    await go(page, '/onboarding?demo=1&lang=ro&e2e=1');
    // Pick the first choice via testid and continue
    await expect(page.getByTestId('onboarding-intro')).toBeVisible();
    await page.getByTestId('onboarding-choice-calm_clarity').click();
    const cont = page.getByTestId('onboarding-continue');
    // If state is slow to propagate, cycle choices until enabled
    if (await cont.isDisabled()) {
      const choices = page.locator('[data-testid^="onboarding-choice-"]');
      const total = await choices.count();
      for (let i = 0; i < total && (await cont.isDisabled()); i++) {
        await choices.nth(i).click();
      }
    }
    await expect(cont).toBeEnabled({ timeout: 8000 });
    await cont.click();

    // Self‑assessment: set each slider to a mid/high value and continue
    const sliders = page.locator('input[type="range"]');
    const count = await sliders.count();
    for (let i = 0; i < count; i++) {
      await sliders.nth(i).evaluate((el) => { (el as HTMLInputElement).value = '7'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    }
    const selfCont = page.getByTestId('onboarding-self-continue');
    await expect(selfCont).toBeEnabled({ timeout: 5000 });
    await selfCont.click();

    // Mini‑Cuno: answer each question (click first option for each) and save
    const questionBlocks = page.locator('article');
    const qCount = await questionBlocks.count();
    for (let i = 0; i < qCount; i++) {
      const firstOption = questionBlocks.nth(i).locator('button').first();
      await firstOption.click();
    }
    await page.getByTestId('onboarding-minicuno-save').click();
    // Wait explicitly for recommendation step (concise diagnostics)
    await expectVisibleShort(page, page.getByTestId('recommendation-step'), 'recommendation-step', 20000);

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
    await expectVisibleShort(page, page.getByTestId('recommendation-step'), 'recommendation-step');
    await expect(page.getByText(/Nu am putut|eroare|error/i)).toHaveCount(0);
  });
});
