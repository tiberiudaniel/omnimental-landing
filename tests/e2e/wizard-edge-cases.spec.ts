import { test, expect, type Page } from '@playwright/test';
import { expectVisibleShort } from './helpers/diag';
import { go, resetSession } from './helpers/env';

async function setRangeInput(page: Page, locatorStr: string, value: number) {
  const input = page.locator(locatorStr).first();
  await input.scrollIntoViewIfNeeded().catch(() => {});
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test.describe('wizard-edge-cases', () => {
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
    await resetSession(page);
    await go(page, '/?step=intent&lang=ro&e2e=1');
    await expectVisibleShort(page, page.getByTestId('wizard-step-intent'), 'wizard-step-intent');

    // With 0 selections, button must be disabled
    await expect(page.getByTestId('wizard-continue')).toBeDisabled();

    // Select exactly 5 items then continue
    const cloudButtons = page.locator('[data-testid="wizard-step-intent-cloud"] button:not([data-testid="wizard-continue"])');
    for (let i = 0; i < 5; i++) {
      await cloudButtons.nth(i).click();
    }
    await expect(page.getByTestId('wizard-continue')).toBeEnabled();
    await page.getByTestId('wizard-continue').click();
    // Pass reflection step if present (robust wait + click)
    const refl = page.getByTestId('wizard-step-reflection');
    if (await refl.count()) {
      await expectVisibleShort(page, refl, 'wizard-step-reflection');
      await expectVisibleShort(page, page.getByTestId('wizard-reflection-continue'), 'wizard-reflection-continue');
      await page.getByTestId('wizard-reflection-continue').click();
    }
    await expectVisibleShort(page, page.getByTestId('wizard-step-summary'), 'wizard-step-summary', 20000);
    await page.waitForTimeout(120);
  });

  test('edge: user goes back and changes answers midway then completes', async ({ page }) => {
    await resetSession(page);
    await go(page, '/?step=intent&lang=ro&e2e=1');
    const cloudButtons = page.locator('[data-testid="wizard-step-intent-cloud"] button:not([data-testid="wizard-continue"])');
    for (let i = 0; i < 6; i++) await cloudButtons.nth(i).click();
    await page.getByTestId('wizard-continue').click();
    await expectVisibleShort(page, page.getByTestId('wizard-step-summary'), 'wizard-step-summary');
    await page.waitForTimeout(150);

    // Step 0
    await page.getByTestId('stress-slider').scrollIntoViewIfNeeded().catch(() => {});
    await setRangeInput(page, '[data-testid="stress-slider"]', 7);
    await page.getByTestId('speed-days').click();
    await setRangeInput(page, '[data-testid="determination-slider"]', 3);
    await page.getByTestId('wizard-next').click();

    // Step 1 pick budget
    await page.getByTestId('budget-medium').click();
    // Go back
    await page.getByRole('button', { name: 'Înapoi' }).click();
    // Change speed & determination
    await page.getByTestId('speed-months').click();
    await setRangeInput(page, '[data-testid="determination-slider"]', 5);
    await page.getByTestId('wizard-next').click();

    // Step 1 again, budget selection persists? If not, reselect quickly then continue
    // Ensure budget selected
    await page.getByTestId('budget-medium').click();
    await page.getByTestId('wizard-next').click();

    // Step 2: pick emotional state and finish
    await page.getByTestId('emo-stable').click();
    await page.getByTestId('wizard-next').click();

    await expectVisibleShort(page, page.getByTestId('recommendation-step'), 'recommendation-step', 20000);
    await expectVisibleShort(page, page.getByTestId('card-individual'), 'card-individual');
    await expectVisibleShort(page, page.getByTestId('card-group'), 'card-group');
  });

  test('edge: extreme values (urgency 10, min budget) reaches valid recommendation', async ({ page }) => {
    await resetSession(page);
    await go(page, '/?step=intent&lang=ro&e2e=1');
    const cloudButtons = page.locator('[data-testid="wizard-step-intent-cloud"] button:not([data-testid="wizard-continue"])');
    for (let i = 0; i < 7; i++) await cloudButtons.nth(i).click();
    await page.getByTestId('wizard-continue').click();
    await expectVisibleShort(page, page.getByTestId('wizard-step-summary'), 'wizard-step-summary');

    await page.getByTestId('stress-slider').scrollIntoViewIfNeeded().catch(() => {});
    await setRangeInput(page, '[data-testid="stress-slider"]', 10);
    await page.getByTestId('speed-days').click();
    await setRangeInput(page, '[data-testid="determination-slider"]', 5);
    await page.getByTestId('wizard-next').click();

    await setRangeInput(page, '[data-testid="stress-slider"]', 0);
    await page.getByTestId('budget-low').click();
    await page.getByTestId('wizard-next').click();

    await page.getByTestId('emo-stable').click();
    await page.getByTestId('wizard-next').click();

    await expectVisibleShort(page, page.getByTestId('recommendation-step'), 'recommendation-step', 20000);
    await expectVisibleShort(page, page.getByTestId('card-individual'), 'card-individual');
    await expectVisibleShort(page, page.getByTestId('card-group'), 'card-group');
  });
});
