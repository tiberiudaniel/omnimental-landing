import { test, expect } from '@playwright/test';
import { go, resetSession } from './helpers/env';
import { expectVisibleShort } from './helpers/diag';

test.describe('Initiation flow (RO, demo)', () => {
  test('recommendation CTA → Kuno → progress bounces → lesson', async ({ page }) => {
    await resetSession(page);
    await go(page, '/recommendation?demo=1&lang=ro&e2e=1');
    await expectVisibleShort(page, page.getByTestId('recommendation-step'), 'recommendation-step', 20000);
    await expectVisibleShort(page, page.getByTestId('reco-initiation-cta'), 'reco-initiation-cta');
    await page.getByTestId('reco-initiation-cta').click();

    // Mini-test: answer 3+ questions (fallback bank may show 3)
    const options = page.locator('[data-testid="eo-option"]');
    const count = await options.count();
    for (let i = 0; i < Math.min(4, count); i++) {
      await options.nth(i).click();
    }
    // Continue (score page then continue)
    const cont = page.getByTestId('eo-continue');
    await expectVisibleShort(page, cont, 'eo-continue', 20000);
    await cont.click();

    // Progress bounce 1
    await expect(page).toHaveURL(/\/progress/, { timeout: 20000 });
    await expectVisibleShort(page, page.getByTestId('init-banner-1'), 'init-banner-1');
    // Continue to journal
    await page.getByText(/Pasul 2: Jurnal/).click();

    // Journal: type 150+ chars
    const txt = page.getByTestId('init-journal-text');
    await expect(txt).toBeVisible();
    await txt.fill('După mini-test, observ că tema mea prioritară are câteva lacune de înțelegere și pot începe prin pași mici, zilnici, pentru a consolida claritatea și energia.');
    await page.getByTestId('init-journal-save').click();

    // Progress bounce 2
    await expect(page).toHaveURL(/\/progress/, { timeout: 20000 });
    await expectVisibleShort(page, page.getByTestId('init-banner-2'), 'init-banner-2');
    // Ensure recent entries show at least one item
    await expectVisibleShort(page, page.getByTestId('recent-entries'), 'recent-entries');
    await page.getByText(/OmniScope|Pasul 3/).click();

    // OmniScope sliders
    await page.locator('[data-testid="init-scope-time"]').evaluate((el) => { (el as HTMLInputElement).value = '4'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('[data-testid="init-scope-difficulty"]').evaluate((el) => { (el as HTMLInputElement).value = '6'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('[data-testid="init-scope-importance"]').evaluate((el) => { (el as HTMLInputElement).value = '8'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.getByTestId('init-scope-continue').click();

    // Progress bounce 3
    await expect(page).toHaveURL(/\/progress/, { timeout: 20000 });
    await expectVisibleShort(page, page.getByTestId('init-banner-3'), 'init-banner-3');
    await page.getByText(/Stare zilnică|Step 4/).click();

    // Daily state sliders
    for (const k of ['energy','stress','sleep','clarity','confidence','focus']) {
      const sel = `[data-testid="init-daily-${k}"]`;
      await page.locator(sel).evaluate((el) => { (el as HTMLInputElement).value = '7'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    }
    await page.getByTestId('init-daily-continue').click();

    // Progress bounce 4
    await expect(page).toHaveURL(/\/progress/, { timeout: 20000 });
    await expectVisibleShort(page, page.getByTestId('init-banner-4'), 'init-banner-4');
    await page.getByText(/Lecție Kuno|Step 5/).click();

    // Lesson complete → final screen
    await expectVisibleShort(page, page.getByTestId('init-lesson-complete'), 'init-lesson-complete');
    await page.getByTestId('init-lesson-complete').click();
    await expectVisibleShort(page, page.getByTestId('init-final-progress'), 'init-final-progress');
    await page.getByTestId('init-final-progress').click();

    // Final: on progress; Omni Kuno tile should be visible, recent entries present
    await expect(page).toHaveURL(/\/progress/, { timeout: 20000 });
    await expectVisibleShort(page, page.getByTestId('recent-entries'), 'recent-entries');
  });
});

