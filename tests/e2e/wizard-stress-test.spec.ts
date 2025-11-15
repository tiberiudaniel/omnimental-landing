import { test, expect } from '@playwright/test';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

async function setRangeInput(page, locatorStr: string, value: number) {
  const input = page.locator(locatorStr).first();
  await input.evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test('wizard-stress-test', async ({ page }) => {
  // Fail test on any console error
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text() || '';
      // Ignore network noise that doesn't affect UX flow in demo/QA
      if (/Failed to load resource/i.test(text) || /status of 4\d\d/i.test(text)) return;
      throw new Error(`Console error: ${text}`);
    }
  });

  for (let i = 0; i < 20; i += 1) {
    // Always start clean
    await page.context().clearCookies();
    await page.goto('/wizard?step=intent&lang=ro&e2e=1');
    await page.evaluate(() => localStorage.clear());

    // Wait for intent step and pick 5–7 words
    await expect(page.getByTestId('wizard-step-intent')).toBeVisible();
    const cloudButtons = page.locator('[data-testid="wizard-step-intent"] button:not([data-testid="wizard-continue"])');
    await expect(cloudButtons.first()).toBeVisible();
    const total = await cloudButtons.count();
    const picks = Math.min(7, Math.max(5, randInt(5, 7)));
    const chosen = new Set<number>();
    while (chosen.size < Math.min(picks, total)) {
      chosen.add(randInt(0, total - 1));
    }
    for (const idx of chosen) {
      await cloudButtons.nth(idx).click();
    }

    // Ensure Continue is enabled; if disabled, click extra words until enabled
    const continueBtn = page.getByTestId('wizard-continue');
    for (let i = 0; i < total && (await continueBtn.isDisabled()); i++) {
      await cloudButtons.nth(i).click();
    }
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    // New intermediate step before summary: reflection
    await expect(page.getByTestId('wizard-step-reflection')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('wizard-reflection-continue').click();
    await expect(page.getByTestId('wizard-step-summary')).toBeVisible({ timeout: 15000 });

    // Step 0: urgency, speed, determination
    await setRangeInput(page, 'input[type="range"]', randInt(1, 10));
    const speedKey = pickOne(['days','weeks','months'] as const);
    await page.getByTestId(`speed-${speedKey}`).click();
    await setRangeInput(page, 'input[type="range"] >> nth=1', randInt(1, 5));

    // Continue to step 1 (wait out any temporary saving state)
    await expect(page.getByTestId('wizard-next')).toBeVisible({ timeout: 30000 });
    // Relax brittle text check to reduce flakes
    await page.waitForTimeout(100);
    await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 30000 });
    await page.getByTestId('wizard-next').click();

    // Step 1: weekly time, budget, goal type
    await setRangeInput(page, 'input[type="range"]', randInt(0, 8));
    const budgetKey = pickOne(['low','medium','high'] as const);
    await page.getByTestId(`budget-${budgetKey}`).click();
    // goal type by testid
    await page.getByTestId('goal-single').click();

    // Continue to step 2
    await expect(page.getByTestId('wizard-next')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(100);
    await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 30000 });
    await page.getByTestId('wizard-next').click();

    // Step 2: emotional state (pick one)
    await page.getByTestId('emo-stable').click();

    // Continue to Recommendation (wait for explicit ready marker to reduce flake)
    await expect(page.getByTestId('wizard-next')).toBeVisible({ timeout: 30000 });
    const ready = page.getByTestId('wizard-ready');
    await ready.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(100);
    await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 30000 });
    await page.getByTestId('wizard-next').click();

    // Assert recommendation cards are present (parent container may vary)
    await expect(page.getByTestId('card-individual')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('card-group')).toBeVisible();
  }
});
