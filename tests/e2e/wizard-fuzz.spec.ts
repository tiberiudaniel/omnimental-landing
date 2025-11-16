import { test, expect, type Page } from '@playwright/test';
import { expectVisibleShort } from './helpers/diag';
import { go, resetSession } from './helpers/env';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function setRange(page: Page, locatorStr: string, value: number) {
  const input = page.locator(locatorStr).first();
  await expect(input).toBeVisible();
  await input.evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test.describe.configure({ mode: 'parallel' });
test.describe('wizard-fuzz', () => {

const RUNS = Number.parseInt(process.env.E2E_FUZZ_RUNS || '8', 10);

for (let i = 0; i < RUNS; i += 1) {
  test(`run #${i + 1} — alegeri randomizate până la recomandare`, async ({ page }) => {
    test.setTimeout(180000);

    // Start fresh and reduce animation noise
    await resetSession(page);
    // Navigate directly to root with step to avoid alias redirect races under parallel load
    await go(page, '/?step=intent&lang=ro&e2e=1');

    await test.step('Intent cloud: selectează 5–7 și continuă', async () => {
      await expectVisibleShort(page, page.getByTestId('wizard-step-intent'), 'wizard-step-intent', 20000);
      const cloudButtons = page.locator('[data-testid="wizard-step-intent-cloud"] button:not([data-testid="wizard-continue"])');
      await expect(cloudButtons.first()).toBeVisible();
      const total = await cloudButtons.count();
      const picks = randInt(5, Math.min(7, Math.max(5, total)));
      const chosen = new Set<number>();
      while (chosen.size < Math.min(picks, total)) chosen.add(randInt(0, total - 1));
      for (const idx of chosen) await cloudButtons.nth(idx).click();
      await expect(page.getByTestId('wizard-continue')).toBeEnabled();
      await page.getByTestId('wizard-continue').click();
    });

    await test.step('Reflection summary: continuă către sumar', async () => {
      await expectVisibleShort(page, page.getByTestId('wizard-step-reflection'), 'wizard-step-reflection', 20000);
      await expectVisibleShort(page, page.getByTestId('wizard-reflection-continue'), 'wizard-reflection-continue');
      await page.getByTestId('wizard-reflection-continue').click();
    });

    await test.step('Pas 0: urgență, ritm, determinare', async () => {
      await expectVisibleShort(page, page.getByTestId('wizard-step-summary'), 'wizard-step-summary', 20000);
      await setRange(page, '[data-testid="stress-slider"]', randInt(1, 10));
      const speedKey = ['days','weeks','months'][randInt(0, 2)] as 'days' | 'weeks' | 'months';
      await page.getByTestId(`speed-${speedKey}`).click();
      await setRange(page, '[data-testid="determination-slider"]', randInt(1, 5));
      await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 30000 });
      await page.getByTestId('wizard-next').click();
    });

    await test.step('Pas 1: timp/săptămână, buget, tip obiectiv', async () => {
      // Setează timpul pe sliderul dedicat (0..8 ore)
      await setRange(page, '[data-testid="time-slider"]', randInt(0, 8));
      const budgetKey = ['low','medium','high'][randInt(0, 2)] as 'low' | 'medium' | 'high';
      await page.getByTestId(`budget-${budgetKey}`).click();
      const goalKey = ['single','few','broad'][randInt(0, 2)] as 'single' | 'few' | 'broad';
      await page.getByTestId(`goal-${goalKey}`).click();
      await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 30000 });
      await page.getByTestId('wizard-next').click();
    });

    await test.step('Pas 2: stare emoțională + 3 slider‑e', async () => {
      const emoKey = ['stable','fluctuating','unstable'][randInt(0, 2)] as 'stable' | 'fluctuating' | 'unstable';
      await page.getByTestId(`emo-${emoKey}`).click();
      await setRange(page, '[data-testid="groupComfort-slider"]', randInt(1, 10));
      await setRange(page, '[data-testid="learnFromOthers-slider"]', randInt(1, 10));
      await setRange(page, '[data-testid="scheduleFit-slider"]', randInt(1, 10));
      await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 30000 });
      await page.getByTestId('wizard-next').click();
    });

    await test.step('Recomandare: container + ambele carduri vizibile', async () => {
      await expectVisibleShort(page, page.getByTestId('recommendation-step'), 'recommendation-step', 20000);
      await expectVisibleShort(page, page.getByTestId('card-individual'), 'card-individual', 15000);
      await expectVisibleShort(page, page.getByTestId('card-group'), 'card-group', 15000);
    });
  });
}
});
