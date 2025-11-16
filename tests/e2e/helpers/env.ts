import type { Page } from '@playwright/test';

export function getBaseUrl(): string {
  const u = process.env.E2E_BASE_URL;
  if (u && /^https?:\/\//i.test(u)) return u.replace(/\/$/, '');
  // Sensible default for local runs
  return 'http://localhost:3000';
}

export async function go(page: Page, path: string) {
  const base = getBaseUrl();
  const absolute = /^https?:\/\//i.test(path)
    ? path
    : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  // Use DOMContentLoaded to avoid waiting for all assets in dev/HMR
  await page.goto(absolute, { waitUntil: 'domcontentloaded' });
}

export async function resetSession(page: Page) {
  await page.context().clearCookies();
  await page.context().clearPermissions();
  await page.evaluate(() => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
  });
}
