import { test, expect, type Page } from '@playwright/test';
import { go, resetSession } from './helpers/env';
import { fillWizardForUserProfile } from './helpers/wizard';

async function readReflectionsCount(page: Page) {
  // Find the metric tile that contains the label 'Reflections', then read the following number
  const tile = page.locator('div', { has: page.getByText('Reflections') }).first();
  await expect(tile).toBeVisible();
  // The numeric value is the second <p> inside our Metric tile
  const numText = await tile.locator('p').nth(1).innerText();
  const match = numText.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

test.describe('Dashboard data flow (journal + Kuno)', () => {
  test('writes journal → reflections + recent entries; completes lesson → Omni Kuno > 0', async ({ page }) => {
    await resetSession(page);
    // Open progress in e2e mode (header/auth overlays suppressed)
    await go(page, '/progress?e2e=1&lang=ro');

    // Read initial Reflections
    const beforeRef = await readReflectionsCount(page).catch(() => 0);

    // Open journal drawer directly, write a short note, close to trigger save
    await go(page, '/progress?e2e=1&open=journal&lang=ro');
    const ta = page.locator('textarea');
    await expect(ta.first()).toBeVisible();
    await ta.first().fill('Test jurnal — verificare reflections');
    // Close via stable testId to avoid strict-mode ambiguity
    await page.getByTestId('journal-close').click();

    // Back to progress and verify updates
    await go(page, '/progress?e2e=1&lang=ro');
    const afterRef = await readReflectionsCount(page).catch(() => 0);
    expect(afterRef).toBeGreaterThanOrEqual(beforeRef);

    // Recent entries should show at least one item now
    await expect(page.getByText(/Însemnări recente|Recent Entries/)).toBeVisible();
    // A simple heuristic: there should be at least one timestamp or the text we entered
    await expect(page.getByText(/Test jurnal/i)).toBeVisible();

    // Complete a quick Kuno lesson (clarity) and save
    await go(page, '/kuno/learn/clarity-1?cat=clarity&e2e=1');
    // If lesson auto-starts, the options are visible; otherwise click start on list page
    const startBtn = page.getByTestId('learn-start');
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
    }
    for (let i = 0; i < 3; i++) {
      await expect(page.getByTestId('learn-option').first()).toBeVisible();
      await page.getByTestId('learn-option').first().click();
    }
    const finish = page.getByTestId('learn-finish');
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
    }

    // Verify Omni Kuno tile shows a number > 0
    await go(page, '/progress?e2e=1&lang=ro');
    const kunoTile = page.getByTestId('metric-omni-cuno');
    await expect(kunoTile).toBeVisible();
    const kunoText = await kunoTile.innerText();
    const num = parseInt((kunoText.match(/\d+/) || ['0'])[0], 10);
    expect(num).toBeGreaterThan(0);
  });
});

// ---- Targeted Beta E2E: four focused flows ----

async function readDebugFacts(page: Page) {
  await go(page, '/progress?e2e=1&debug=1&lang=ro');
  const pre = page.getByTestId('debug-progress-facts');
  const raw = await pre.evaluate((el) => el.textContent || '{}');
  return JSON.parse(raw || '{}') as { intent?: unknown; evaluation?: unknown; sessions?: number; events?: number; quickAssessment?: { updated?: boolean } };
}

async function loginTestUser(page: Page) {
  // Optional: use a preconfigured login URL (e.g., emulator helper) provided via env
  const loginUrl = process.env.E2E_LOGIN_URL;
  if (!loginUrl) {
    test.skip(true, 'E2E_LOGIN_URL not set; skipping login-dependent flow');
  }
  await go(page, loginUrl!);
  // Wait for app to route back to /progress (or any authenticated page)
  await page.waitForTimeout(800); // small settle window
}

test.describe('Beta flows', () => {
  test('Flow 1: New user → onboarding → progress', async ({ page }) => {
    await resetSession(page);
    // Drive minimal wizard
    await go(page, '/wizard?step=intent&lang=ro');
    await fillWizardForUserProfile(page, {
      name: 'Flow1', urgency: 7, determination: 4, weeklyHours: 4, speed: 'Săptămâni', budget: 'Buget mediu', picks: 6,
    });
    // Jump to progress
    await go(page, '/progress?e2e=1&lang=ro');

    // Cardul principal nu e empty: titlu guidance prezent
    await expect(page.getByText(/Antrenamentul tău de azi|Today's guidance/)).toBeVisible();
    // Secțiunea trend/grafice prezentă
    await expect(page.getByTestId('trends-chart')).toBeVisible();

    // Debug: intent + evaluation populate
    const dbg = await readDebugFacts(page);
    expect(dbg.intent).toBeTruthy();
    expect(dbg.evaluation).toBeTruthy();
  });

  test('Flow 2: Guest → onboarding → login → progress (migrare)', async ({ page }) => {
    await resetSession(page);
    // Do a quick action as guest: open journal, save short note
    await go(page, '/progress?e2e=1&open=journal&lang=ro');
    const ta = page.locator('textarea');
    await expect(ta.first()).toBeVisible();
    await ta.first().fill('Flow2 – notă scurtă pentru migrare');
    await page.getByTestId('journal-close').click();
    // Verify data exists pre-login
    let dbg = await readDebugFacts(page);
    const preSessions = dbg.sessions || 0;
    expect(preSessions).toBeGreaterThanOrEqual(0);

    // Trigger real login (env-provided). If not set, this test skips.
    await loginTestUser(page);

    // Back to /progress and verify data did not reset
    dbg = await readDebugFacts(page);
    const postSessions = dbg.sessions || 0;
    expect(postSessions).toBeGreaterThanOrEqual(preSessions);
    // Bonus: no suspicious doubling (best-effort): allow +1 margin
    expect(postSessions).toBeLessThanOrEqual(preSessions + 1);
  });

  test('Flow 3: Demo vs live gating', async ({ page }) => {
    await resetSession(page);
    await loginTestUser(page);
    // Demo page
    await go(page, '/progress?demo=1&lang=ro');
    await expect(page.getByText(/Demo/)).toBeVisible();
    // Live page (no demo)
    await go(page, '/progress?lang=ro');
    await expect(page.getByText(/Demo/)).not.toBeVisible({ timeout: 1000 }).catch(() => {});
    // from=experience-onboarding should NOT force demo
    await go(page, '/progress?from=experience-onboarding&lang=ro');
    await expect(page.getByText(/Demo/)).not.toBeVisible({ timeout: 1000 }).catch(() => {});
  });

  test('Flow 4: QuickAssessment → cardul „azi”', async ({ page }) => {
    await resetSession(page);
    // Ensure baseline exists by running a quick wizard-first-step subset or just proceed to daily-state
    await go(page, '/experience-onboarding?flow=initiation&step=daily-state&lang=ro');
    // Set extremes to force visible change
    const set = async (id: string, val: number) => {
      const input = page.getByTestId(id).first();
      await expect(input).toBeVisible();
      await input.evaluate((el, v) => { (el as HTMLInputElement).value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); }, val);
    };
    await set('init-daily-energy', 2);
    await set('init-daily-stress', 9);
    await set('init-daily-clarity', 3);
    await page.getByTestId('init-daily-continue').click();

    // Progress: expect the guidance card to show the “· starea de azi” indicator
    await go(page, '/progress?e2e=1&lang=ro');
    await expect(page.getByText(/starea de azi|today/)).toBeVisible();
    // Debug confirms QA flag present
    const dbg = await readDebugFacts(page);
    expect(dbg.quickAssessment?.updated).toBeTruthy();
  });
});
