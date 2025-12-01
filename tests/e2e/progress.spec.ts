import { test, expect } from '@playwright/test';
import { go, resetSession } from './helpers/env';

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

test.describe.skip('Progress dashboard (legacy, UX changed)', () => {
  // TODO: realign after initiation/wizard redesign
  test('loads demo dashboard and toggles Day/Week & Minutes/Sessions', async ({ page }) => {
    await resetSession(page);
    await go(page, '/progress?demo=1&e2e=1');

    // Expect demo badge present (optional based on env switcher, but title/text should exist)
    await expect(page.getByText(ro.insightTitle)).toBeVisible();
    await expect(page.getByText(ro.todayQuest)).toBeVisible();

    // Weekly trend by default
    await expect(page.locator('h3', { hasText: ro.trendsTitle })).toBeVisible();

    // Switch to monthly then back to weekly view (chart aria labels change with timeframe)
    await page.getByTestId('trend-toggle-month').click();
    await expect(page.getByTestId('trends-chart')).toHaveAttribute('aria-label', /Trend lunar/i);
    await page.getByTestId('trend-toggle-week').click();
    await expect(page.getByTestId('trends-chart')).toHaveAttribute('aria-label', /Trend săptămânal/i);

    // Toggle metrics: sessions + score should update the legend text
    await expect(page.getByText('Evoluția activităților')).toBeVisible();
    await page.getByTestId('trend-toggle-sessions').click();
    await expect(page.getByText('Evoluția activităților')).toBeVisible();
    await page.getByTestId('trend-toggle-score').click();
    await expect(page.getByText('Scor activitate (0–100)')).toBeVisible();
    await page.getByTestId('trend-toggle-minutes').click();

    // Numeric labels above bars should be visible (at least one number)
    const anyNumber = page.getByTestId('trends-chart').locator('svg text').filter({ hasText: /\d+/ });
    await expect(anyNumber.first()).toBeVisible();
  });
});
