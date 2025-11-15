import { test, expect } from '@playwright/test';
import { fillWizardForUserProfile, type WizardProfile } from './helpers/wizard';

// 10 user profiles, each documented
const users: WizardProfile[] = [
  // 1) Foarte urgent, buget minim, ritm rapid
  { name: 'urgent_low_budget', speed: 'Zile', urgency: 9, determination: 5, budget: 'Buget minim', weeklyHours: 1, picks: 6 },
  // 2) Relaxat, buget mediu, ritm săptămâni
  { name: 'calm_medium_budget', speed: 'Săptămâni', urgency: 3, determination: 2, budget: 'Buget mediu', weeklyHours: 2, picks: 5 },
  // 3) Urgent, buget mare, ritm rapid
  { name: 'fast_high_budget', speed: 'Zile', urgency: 8, determination: 4, budget: 'Buget maxim', weeklyHours: 4 },
  // 4) Lent, buget minim, urgență mică
  { name: 'slow_low_budget', speed: 'Luni', urgency: 2, determination: 2, budget: 'Buget minim', weeklyHours: 0 },
  // 5) Mediu, buget mediu
  { name: 'steady_medium_budget', speed: 'Săptămâni', urgency: 5, determination: 3, budget: 'Buget mediu', weeklyHours: 3 },
  // 6) Max urgență, buget minim
  { name: 'max_urgency_low_budget', speed: 'Zile', urgency: 10, determination: 5, budget: 'Buget minim', weeklyHours: 2 },
  // 7) Min urgență, buget maxim
  { name: 'min_urgency_high_budget', speed: 'Luni', urgency: 1, determination: 1, budget: 'Buget maxim', weeklyHours: 1 },
  // 8) Săptămâni, buget mediu, determinare mare
  { name: 'weeks_medium_budget', speed: 'Săptămâni', urgency: 6, determination: 4, budget: 'Buget mediu', weeklyHours: 5 },
  // 9) Luni, buget minim, determinare medie
  { name: 'months_low_budget', speed: 'Luni', urgency: 4, determination: 3, budget: 'Buget minim', weeklyHours: 1 },
  // 10) Echilibrat, buget mare
  { name: 'balanced_high_budget', speed: 'Săptămâni', urgency: 7, determination: 4, budget: 'Buget maxim', weeklyHours: 4 },
];

// no local helpers required; flow is handled by fillWizardForUserProfile

test.describe('Wizard multi-user scenarios (RO)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text() || '';
        // Ignore benign 4xx fetch noise in dev/QA
        if (/Failed to load resource/i.test(text) || /status of 4\d\d/i.test(text)) return;
        throw new Error(`Console error: ${text}`);
      }
    });
  });

  for (const user of users) {
    test(`scenario: ${user.name}`, async ({ page }) => {
      await page.goto('/wizard?step=intent&lang=ro');
      await fillWizardForUserProfile(page, user);
      // Also ensure no obvious error messages in UI
      await expect(page.getByText(/Nu am putut|eroare|error/i)).toHaveCount(0);
    });
  }
});
