import { test, expect } from '@playwright/test';

test.describe('Progress CTA for experience onboarding (demo)', () => {
  test('shows CTA on from=experience-onboarding and hides after completion flag', async ({ page }) => {
    // First visit with from=experience-onboarding in demo mode
    await page.goto('/progress?demo=1&from=experience-onboarding&lang=ro&e2e=1');
    await expect(page.getByText('Continuă experiența ghidată')).toBeVisible();

    // Click CTA and land on journal step
    await page.getByTestId('progress-cta-eo-continue').click();
    await page.waitForURL(/experience-onboarding\?step=journal/, { timeout: 15000 }).catch(() => {});

    // Fill journal quickly and save
    await page.getByTestId('eo-journal-text').fill('Test jurnal din E2E');
    await page.getByRole('button', { name: 'Salvează' }).click();
    // Redirects to /progress?after=os, continue to breath manually
    await page.goto('/experience-onboarding?step=breath&lang=ro&e2e=1');
    // Mark completion
    await page.getByRole('button', { name: 'Am terminat' }).click();

    // Return to progress with from=experience-onboarding — CTA should be hidden (guest flag set)
    await page.goto('/progress?demo=1&from=experience-onboarding&lang=ro&e2e=1');
    await expect(page.getByText('Continuă experiența ghidată')).toHaveCount(0);
  });
});
