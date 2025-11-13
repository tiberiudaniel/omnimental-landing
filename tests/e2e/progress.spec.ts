import { test, expect } from '@playwright/test';

const ro = {
  demoBadge: 'Demo',
  insightTitle: 'Revelația zilei',
  todayQuest: 'Provocarea de azi',
  trendsTitle: 'Trend săptămânal',
  day: 'Azi',
  week: 'Săptămână',
  minutes: 'Minute',
  sessions: 'Sesiuni',
};

test.describe('Progress dashboard (demo)', () => {
  test('loads demo dashboard and toggles Day/Week & Minutes/Sessions', async ({ page }) => {
    await page.goto('/progress?demo=1');

    // Expect demo badge present (optional based on env switcher, but title/text should exist)
    await expect(page.getByText(ro.insightTitle)).toBeVisible();
    await expect(page.getByText(ro.todayQuest)).toBeVisible();

    // The trends title includes Day/Week and metric
    const title = page.locator('h3', { hasText: ro.trendsTitle });
    await expect(title).toBeVisible();

    // Toggle Day
    await page.getByTestId('trend-toggle-day').click();
    await expect(page.locator('h3', { hasText: `${ro.trendsTitle} — ${ro.day}` })).toBeVisible();

    // Toggle Sessions
    await page.getByTestId('trend-toggle-sessions').click();
    await expect(page.locator('h3', { hasText: `${ro.trendsTitle} — ${ro.day} • ${ro.sessions}` })).toBeVisible();

    // Numeric labels above bars should be visible (at least one number)
    const anyNumber = page.getByTestId('trends-chart').locator('svg text').filter({ hasText: /\d+/ });
    await expect(anyNumber.first()).toBeVisible();

    // Switch to Week + Minutes
    await page.getByTestId('trend-toggle-week').click();
    await page.getByTestId('trend-toggle-minutes').click();
    await expect(page.locator('h3', { hasText: `${ro.trendsTitle} — ${ro.week} • ${ro.minutes}` })).toBeVisible();
  });
});
