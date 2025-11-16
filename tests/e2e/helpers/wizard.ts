import { expect, Page } from '@playwright/test';
import { expectVisibleShort } from './diag';

export type WizardProfile = {
  name: string;
  /** 1..10 */ urgency: number;
  /** 1..5 */ determination: number;
  /** 0..8 */ weeklyHours?: number;
  speed: 'Zile' | 'Săptămâni' | 'Luni';
  budget: 'Buget minim' | 'Buget mediu' | 'Buget maxim';
  /** number of intent words to pick (5..7) */ picks?: number;
};

export async function setRangeInput(page: Page, locatorStr: string, value: number) {
  const input = page.locator(locatorStr).first();
  await expect(input).toBeVisible();
  await input.evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

/**
 * Drives the wizard for a given profile. Assumes starting at /wizard?step=intent&lang=ro
 * Returns when the recommendation page is visible.
 */
export async function fillWizardForUserProfile(page: Page, prof: WizardProfile) {
  // Intent cloud: pick N words
  await expectVisibleShort(page, page.getByTestId('wizard-step-intent'), 'wizard-step-intent');
  // Prefer stable container testId over class-based selector
  const cloudButtons = page.locator('[data-testid="wizard-step-intent-cloud"] button:not([data-testid="wizard-continue"])');
  const toPick = Math.max(5, Math.min(7, prof.picks ?? 6));
  const total = await cloudButtons.count();
  for (let i = 0; i < Math.min(toPick, total); i++) {
    await cloudButtons.nth(i).click();
  }
  // Ensure Continue enabled; if disabled, click extra unique words until it enables
  const continueBtn = page.getByTestId('wizard-continue');
  for (let i = 0; i < total && (await continueBtn.isDisabled()); i++) {
    await cloudButtons.nth(i).click();
  }
  await expect(continueBtn).toBeEnabled({ timeout: 15000 });
  await continueBtn.click();
  // New flow: intent -> reflectionSummary -> intentSummary
  await expectVisibleShort(page, page.getByTestId('wizard-step-reflection'), 'wizard-step-reflection');
  await page.getByTestId('wizard-reflection-continue').click();
  await expectVisibleShort(page, page.getByTestId('wizard-step-summary'), 'wizard-step-summary');

  // Step 0: urgency + speed + determination
  await setRangeInput(page, '[data-testid="stress-slider"]', prof.urgency);
  const speedKey = prof.speed === 'Zile' ? 'days' : prof.speed === 'Săptămâni' ? 'weeks' : 'months';
  await page.getByTestId(`speed-${speedKey}`).click();
  await setRangeInput(page, '[data-testid="determination-slider"]', prof.determination);
  await expect(page.getByTestId('wizard-next')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('wizard-next')).not.toHaveText(/Se salvează|Saving/i, { timeout: 30000 });
  await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 30000 });
  await page.getByTestId('wizard-next').click();

  // Step 1: weekly time (slider), budget, goal type
  await setRangeInput(page, '[data-testid="time-slider"]', prof.weeklyHours ?? 4);
  const budgetKey = prof.budget.includes('minim') ? 'low' : prof.budget.includes('mediu') ? 'medium' : 'high';
  await page.getByTestId(`budget-${budgetKey}`).click();
  // Pick a default goal for stability
  const goalBtn = page.getByTestId('goal-single');
  if (await goalBtn.count()) await goalBtn.click();
  await expect(page.getByTestId('wizard-next')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('wizard-next')).not.toHaveText(/Se salvează|Saving/i, { timeout: 30000 });
  await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 30000 });
  await page.getByTestId('wizard-next').click();

  // Step 2: emotional state (pick first)
  // Pick stable by default
  const emoBtn = page.getByTestId('emo-stable');
  if (await emoBtn.count()) await emoBtn.click();
  await expect(page.getByTestId('wizard-next')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('wizard-next')).not.toHaveText(/Se salvează|Saving/i, { timeout: 30000 });
  await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 30000 });
  await page.getByTestId('wizard-next').click();

  // Recommendation CTAs must be visible (container may vary)
  await expectVisibleShort(page, page.getByTestId('recommendation-step'), 'recommendation-step', 20000);
  await expectVisibleShort(page, page.getByTestId('card-individual'), 'card-individual', 15000);
  await expectVisibleShort(page, page.getByTestId('card-group'), 'card-group', 15000);

  // Assert key summary phrases visible
  // Verify summary card present (copy may vary slightly)
  await expectVisibleShort(page, page.getByText(/recomandarea mea|recommendation, based/i), 'summary-callout');
  // Pace phrase mapping used in RecommendationStep
  const pace = prof.speed === 'Zile' ? 'câteva zile' : prof.speed === 'Săptămâni' ? 'câteva săptămâni' : 'câteva luni';
  await expect(page.getByText(new RegExp(pace))).toBeVisible();
  const budgetWord = prof.budget.includes('minim') ? 'minim' : prof.budget.includes('mediu') ? 'mediu' : 'maxim';
  await expect(page.getByText(new RegExp(budgetWord))).toBeVisible();
}
