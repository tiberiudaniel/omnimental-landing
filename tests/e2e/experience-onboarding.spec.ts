import { test, expect } from '@playwright/test';

test.describe('Experience Onboarding (Initiation flow)', () => {
  test('completes initiation journey and reaches progress', async ({ page }) => {
    await page.goto('/experience-onboarding?flow=initiation&step=welcome&lang=ro&e2e=1');

    // Welcome → Intro → Lesson 0
    await page.getByRole('button', { name: /intră în inițiere/i }).click();
    await page.getByTestId('eo-start').click();
    await page.getByRole('button', { name: /^Continuă$/i }).click();

    // First action plan
    await page.getByTestId('first-action-plan').fill('Acțiunea mea este să scriu draftul inițierii.');
    await page.getByTestId('first-action-submit').click();

    // OmniKuno context questions (if any)
    const contextQuestions = page.getByTestId('init-kuno-question');
    const contextCount = await contextQuestions.count();
    for (let i = 0; i < contextCount; i++) {
      await contextQuestions.nth(i).getByTestId('init-kuno-option').first().click();
    }
    await page.getByTestId('init-kuno-continue').click();

    // Journal entry must be filled and saved
    const journalInput = page.getByTestId('eo-journal-text');
    await journalInput.fill('Jurnal inițiere end-to-end');
    await expect(journalInput).toHaveValue(/Jurnal inițiere/);
    await page.getByRole('button', { name: /Salvează/i }).click();

    // OmniScope sliders
    await page.getByTestId('init-scope-impact').fill('7');
    await page.getByTestId('init-scope-readiness').fill('7');
    await page.getByTestId('init-scope-frequency').fill('6');
    await page.getByTestId('init-scope-continue').click();

    // Daily state and lesson
    await page.getByTestId('init-daily-energy').fill('7');
    await page.getByTestId('init-daily-continue').click();
    await page.getByRole('button', { name: /^Continuă$/i }).click();

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
