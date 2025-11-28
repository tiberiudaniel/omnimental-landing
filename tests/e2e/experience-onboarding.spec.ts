import { test, expect } from '@playwright/test';

test.describe.skip('Experience Onboarding (legacy, UX changed)', () => {
  // TODO: realign after initiation/wizard redesign
  test('completes initiation journey and reaches progress', async ({ page }) => {
    await page.goto('/experience-onboarding?flow=initiation&step=welcome&lang=ro&e2e=1');

    const setSliderValue = async (testId: string, value: number) => {
      const slider = page.getByTestId(testId);
      await slider.evaluate(
        (el, target) => {
          const input = el as HTMLInputElement;
          input.value = String(target);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        },
        value,
      );
    };

    // Welcome → Intro → Daily state
    await page.getByRole('button', { name: /intră în inițiere/i }).click();
    await page.getByTestId('eo-start').click();
    // Test browser back navigation between initiation steps
    await page.goBack();
    await expect(page).toHaveURL(/step=welcome/);
    await page.getByRole('button', { name: /intră în inițiere/i }).click();
    await page.getByTestId('eo-start').click();
    const dailyKeys: Array<{ id: string; value: number }> = [
      { id: 'init-daily-energy', value: 7 },
      { id: 'init-daily-stress', value: 4 },
      { id: 'init-daily-sleep', value: 8 },
      { id: 'init-daily-clarity', value: 6 },
      { id: 'init-daily-confidence', value: 7 },
      { id: 'init-daily-focus', value: 5 },
    ];
    for (const slider of dailyKeys) {
      await setSliderValue(slider.id, slider.value);
    }
    await page.getByTestId('init-daily-continue').click();

    // OmniKuno context questions (if any)
    const contextQuestions = page.getByTestId('init-kuno-question');
    const contextCount = await contextQuestions.count();
    for (let i = 0; i < contextCount; i++) {
      await contextQuestions.nth(i).getByTestId('init-kuno-option').first().click();
    }
    await page.getByTestId('init-kuno-continue').click();

    // Lesson 0 (expand card then go through all steps)
    await page.getByTestId('init-lesson-shell').click();
    for (let i = 0; i < 6; i++) {
      await page.getByRole('button', { name: /continuă/i }).click();
    }
    await page.getByTestId('init-lesson-inline-option').first().click();
    await page.getByRole('button', { name: /Finalizează lecția/i }).click();

    // First action plan
    await page.getByTestId('first-action-plan').fill('Acțiunea mea este să scriu draftul inițierii.');
    await page.getByTestId('first-action-submit').click();

    // OmniScope sliders
    await setSliderValue('init-scope-impact', 7);
    await setSliderValue('init-scope-readiness', 8);
    await setSliderValue('init-scope-frequency', 6);
    await page.getByTestId('init-scope-continue').click();

    // Journal entry must be filled and saved
    const journalInput = page.getByTestId('eo-journal-text');
    await journalInput.fill('Jurnal inițiere end-to-end');
    await expect(journalInput).toHaveValue(/Jurnal inițiere/);
    await page.getByRole('button', { name: /Salvează/i }).click();

    // Lesson quiz (answer both questions)
    const quizCards = page.getByTestId('eo-question');
    const quizCount = await quizCards.count();
    for (let i = 0; i < quizCount; i++) {
      await quizCards.nth(i).getByTestId('eo-option').first().click();
    }

    // Final summary should link to recommendation view
    await expect(page.locator('a[href="/recommendation?from=initiation"]')).toBeVisible();

    // Finish flow and land on progress
    await page.getByTestId('init-lesson-quiz-submit').click();
    await expect(page).toHaveURL(/\/progress\?from=initiation&completed=1/, { timeout: 20000 });
  });
});
