import { test, expect } from '@playwright/test';
import { expectVisibleShort } from './helpers/diag';
import { go, resetSession } from './helpers/env';

test.describe.skip('Onboarding flow (legacy, UX changed)', () => {
  // TODO: realign after initiation/wizard redesign
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text() || '';
        if (/Failed to load resource/i.test(text) || /status of 4\d\d/i.test(text)) return;
        throw new Error(`Console error: ${text}`);
      }
    });
  });

  test('initiation experience → progress redirect', async ({ page }) => {
    await resetSession(page);
    await go(page, '/experience-onboarding?flow=initiation&step=welcome&demo=1&lang=ro&e2e=1');

    // Welcome → Intro
    await expect(page.getByTestId('init-welcome-begin')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('init-welcome-begin').click();
    await expect(page).toHaveURL(/step=intro/);
    const startBtn = page.getByTestId('eo-start');
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();

    // Daily state sliders: touch each mixer so continue activates
    const dailyKeys = ['energy', 'stress', 'sleep', 'clarity', 'confidence', 'focus'] as const;
    for (const key of dailyKeys) {
      const slider = page.getByTestId(`init-daily-${key}`).first();
      await slider.waitFor({ state: 'visible', timeout: 15000 });
      await slider.evaluate((el) => {
        (el as HTMLInputElement).value = '8';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    await page.getByTestId('init-daily-continue').click();

    // Kuno context questions (if any)
    const kunoQuestions = page.getByTestId('init-kuno-question');
    const questionCount = await kunoQuestions.count();
    for (let i = 0; i < questionCount; i++) {
      const firstOption = kunoQuestions.nth(i).getByTestId('init-kuno-option').first();
      await firstOption.click();
    }
    await page.getByTestId('init-kuno-continue').click();

    // Lesson carousel: advance through content blocks, answer inline quiz
    for (let step = 0; step < 6; step++) {
      const continueBtn = page.getByTestId('onboarding-lesson-shell').getByRole('button', { name: /continuă|continue/i }).last();
      await continueBtn.click();
    }
    const inlineQuestion = page.getByTestId('init-lesson-inline-question');
    await expect(inlineQuestion).toBeVisible({ timeout: 15000 });
    await inlineQuestion.getByTestId('init-lesson-inline-option').first().click();
    await page.getByTestId('init-lesson-complete').click();

    // First action: describe an action and continue
    const actionText = `Plan inițiere ${Date.now()}`;
    await expect(page.getByTestId('first-action-plan')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('first-action-plan').fill(actionText);
    await page.getByTestId('first-action-submit').click();

    // OmniScope sliders
    const scopeKeys = ['impact', 'readiness', 'frequency'] as const;
    for (const key of scopeKeys) {
      const slider = page.getByTestId(`init-scope-${key}`);
      await slider.waitFor({ state: 'visible', timeout: 15000 });
      await slider.evaluate((el) => {
        (el as HTMLInputElement).value = '8';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    await page.getByTestId('init-scope-continue').click();

    // Journal reflection
    const journalEntry = `Inițiere E2E ${Date.now()}`;
    await expect(page.getByTestId('eo-journal-text')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('eo-journal-text').fill(journalEntry);
    await page.getByTestId('eo-journal-save').click();

    // Final quiz (2 questions)
    const finalQuestions = page.getByTestId('eo-question');
    const finalCount = await finalQuestions.count();
    for (let i = 0; i < finalCount; i++) {
      await finalQuestions.nth(i).getByTestId('eo-option').first().click();
    }
    await page.getByRole('button', { name: /Finalizează|Finalize/i }).click();
    await page.getByTestId('init-lesson-quiz-submit').click();

    // Redirect to progress dashboard
    await expect(page).toHaveURL(/\/progress/);
    await expectVisibleShort(page, page.getByTestId('trends-chart'), 'progress-trends', 20000);
  });
});
