import { test, expect } from '@playwright/test';

async function setRangeInput(page, locatorStr: string, value: number) {
  const input = page.locator(locatorStr).first();
  await input.scrollIntoViewIfNeeded().catch(() => {});
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test.describe('Wizard edge cases (RO)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text() || '';
        if (/Failed to load resource/i.test(text) || /status of 4\d\d/i.test(text)) return;
        throw new Error(`Console error: ${text}`);
      }
    });
  });

  test('edge: no intent selection disables continue, then minimum selection proceeds', async ({ page }) => {
    await page.goto('/wizard?step=intent&lang=ro&e2e=1');
    await expect(page.getByTestId('wizard-step-intent')).toBeVisible();

    // With 0 selections, button must be disabled
    await expect(page.getByTestId('wizard-continue')).toBeDisabled();

    // Select exactly 5 items then continue
    const cloudButtons = page.locator('button[class*="rounded-[14px]"]');
    for (let i = 0; i < 5; i++) {
      await cloudButtons.nth(i).click();
    }
    await expect(page.getByTestId('wizard-continue')).toBeEnabled();
    await page.getByTestId('wizard-continue').click();
    // Pass reflection step if present
    const refl = page.getByTestId('wizard-step-reflection');
    if (await refl.isVisible().catch(() => false)) {
      await page.getByTestId('wizard-reflection-continue').click();
    }
    await expect(page.getByTestId('wizard-step-summary')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(150);
  });

  test('edge: user goes back and changes answers midway then completes', async ({ page }) => {
    await page.goto('/wizard?step=intent&lang=ro&e2e=1');
    const cloudButtons = page.locator('button[class*="rounded-[14px]"]');
    for (let i = 0; i < 6; i++) await cloudButtons.nth(i).click();
    await page.getByTestId('wizard-continue').click();
    await expect(page.getByTestId('wizard-step-summary')).toBeVisible();
    await page.waitForTimeout(150);

    // Step 0
    await page.locator('input[type="range"]').first().scrollIntoViewIfNeeded().catch(() => {});
    await setRangeInput(page, 'input[type="range"]', 7);
    await page.getByTestId('speed-days').click();
    await setRangeInput(page, 'input[type="range"] >> nth=1', 3);
    await page.getByTestId('wizard-next').click();

    // Step 1 pick budget
    await page.getByTestId('budget-medium').click();
    // Go back
    await page.getByRole('button', { name: 'Înapoi' }).click();
    // Change speed & determination
    await page.getByTestId('speed-months').click();
    await setRangeInput(page, 'input[type="range"] >> nth=1', 5);
    await page.getByTestId('wizard-next').click();

    // Step 1 again, budget selection persists? If not, reselect quickly then continue
    // Ensure budget selected
    await page.getByTestId('budget-medium').click();
    await page.getByTestId('wizard-next').click();

    // Step 2: pick emotional state and finish
    await page.getByTestId('emo-stable').click();
    await page.getByTestId('wizard-next').click();

    await expect(page.getByTestId('recommendation-step')).toBeVisible();
    await expect(page.getByTestId('card-individual')).toBeVisible();
    await expect(page.getByTestId('card-group')).toBeVisible();
  });

  test('edge: extreme values (urgency 10, min budget) reaches valid recommendation', async ({ page }) => {
    await page.goto('/wizard?step=intent&lang=ro&e2e=1');
    const cloudButtons = page.locator('button[class*="rounded-[14px]"]');
    for (let i = 0; i < 7; i++) await cloudButtons.nth(i).click();
    await page.getByTestId('wizard-continue').click();
    await expect(page.getByTestId('wizard-step-summary')).toBeVisible();

    await page.locator('input[type="range"]').first().scrollIntoViewIfNeeded().catch(() => {});
    await setRangeInput(page, 'input[type="range"]', 10);
    await page.getByTestId('speed-days').click();
    await setRangeInput(page, 'input[type="range"] >> nth=1', 5);
    await page.getByTestId('wizard-next').click();

    await setRangeInput(page, 'input[type="range"]', 0);
    await page.getByTestId('budget-low').click();
    await page.getByTestId('wizard-next').click();

    await page.getByTestId('emo-stable').click();
    await page.getByTestId('wizard-next').click();

    await expect(page.getByTestId('recommendation-step')).toBeVisible();
    await expect(page.getByTestId('card-individual')).toBeVisible();
    await expect(page.getByTestId('card-group')).toBeVisible();
  });
});
