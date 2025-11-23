import { expect, Page } from '@playwright/test';
import { expectVisibleShort } from './diag';
const STEP_INTENT = 'wizard-step-intent';
const STEP_REFLECTION_PROMPT = 'wizard-step-reflectionPrompt';
const STEP_INTENT_MOTIVATION = 'wizard-step-intentMotivation';
const STEP_NEED_MAIN = 'wizard-step-needMain';
const STEP_NEED_CONFIDENCE = 'wizard-step-needConfidence';
const STEP_MICRO_INFO = 'wizard-step-microLessonInfo';


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
 * Drives the wizard for a given profile. Assumes starting at /wizard?step=intent&lang=ro&e2e=1
 * Returns when the recommendation page is visible.
 */
export async function fillWizardForUserProfile(page: Page, prof: WizardProfile) {
  // Intent cloud: pick N words
  await expectVisibleShort(page, page.getByTestId(STEP_INTENT), STEP_INTENT);
  // Prefer stable container testId over class-based selector
  const cloudButtons = page.locator(`[data-testid=\"${STEP_INTENT}-cloud\"] button:not([data-testid=\"wizard-continue\"])`);
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
  // New flow: intent -> reflectionSummary -> need steps -> intentSummary
  await expectVisibleShort(page, page.getByTestId(STEP_REFLECTION_PROMPT), STEP_REFLECTION_PROMPT);
  await page.getByTestId('wizard-reflection-continue').click();
  await maybeHandleNeedFlow(page);
  await expectVisibleShort(page, page.getByTestId(STEP_INTENT_MOTIVATION), STEP_INTENT_MOTIVATION, 20000);

  // Step 0: urgency + speed + determination
  await setRangeInput(page, '[data-testid="stress-slider"]', prof.urgency);
  const speedKey = prof.speed === 'Zile' ? 'days' : prof.speed === 'Săptămâni' ? 'weeks' : 'months';
  await page.getByTestId(`speed-${speedKey}`).click();
  await setRangeInput(page, '[data-testid="determination-slider"]', prof.determination);
  await clickWizardNext(page);

  // Step 1: weekly time (slider), budget, goal type
  await setRangeInput(page, '[data-testid="time-slider"]', prof.weeklyHours ?? 4);
  const budgetKey = prof.budget.includes('minim') ? 'low' : prof.budget.includes('mediu') ? 'medium' : 'high';
  await page.getByTestId(`budget-${budgetKey}`).click();
  // Pick a default goal for stability
  const goalBtn = page.getByTestId('goal-single');
  if (await goalBtn.count()) await goalBtn.click();
  await clickWizardNext(page);

  // Step 2: emotional state (pick first)
  // Pick stable by default
  const emoBtn = page.getByTestId('emo-stable');
  if (await emoBtn.count()) await emoBtn.click();
  await clickWizardNext(page);

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

async function maybeHandleNeedFlow(page: Page) {
  try {
    await expectVisibleShort(page, page.getByTestId(STEP_NEED_MAIN), STEP_NEED_MAIN, 15000);
  } catch {
    return;
  }
  const needOptions = page.locator('[data-testid^="need-opt-"]');
  const optCount = await needOptions.count();
  const picks = Math.min(2, optCount);
  for (let i = 0; i < picks; i++) {
    await needOptions.nth(i).click();
  }
  const needContinue = page.getByTestId('need-main-continue');
  await expect(needContinue).toBeEnabled({ timeout: 10000 });
  await needContinue.click();
  await expectVisibleShort(page, page.getByTestId(STEP_NEED_CONFIDENCE), STEP_NEED_CONFIDENCE, 15000);
  await page.getByTestId('need-confidence-continue').click();
  await expectVisibleShort(page, page.getByTestId(STEP_MICRO_INFO), STEP_MICRO_INFO, 15000);
  const microBtn = page.getByTestId('wizard-microlesson-btn').first();
  if (await microBtn.isVisible().catch(() => false)) {
    await microBtn.click();
  }
}

async function clickWizardNext(page: Page) {
  const prevSub = await getCurrentSub(page);
  const nextBtn = page.getByTestId('wizard-next');
  await expect(nextBtn).toBeEnabled({ timeout: 30000 });
  await nextBtn.click({ noWaitAfter: true });
  try {
    await page.waitForFunction(
      (prev) => {
        try {
          const current = new URL(window.location.href).searchParams.get('sub');
          if (!prev && current) return true;
          return current !== prev;
        } catch {
          return false;
        }
      },
      prevSub,
      { timeout: 20000 },
    );
  } catch {
    // no-op if sub isn't used on this step
  }
  await page.waitForTimeout(100);
}

async function getCurrentSub(page: Page) {
  try {
    return await page.evaluate(() => {
      try {
        return new URL(window.location.href).searchParams.get('sub');
      } catch {
        return null;
      }
    });
  } catch {
    return null;
  }
}
