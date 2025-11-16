import { expect, Page, Locator } from '@playwright/test';

export async function expectVisibleShort(page: Page, locator: Locator, name: string, timeout = 15000) {
  try {
    await expect(locator).toBeVisible({ timeout });
  } catch {
    const url = page.url();
    let count = -1;
    try { count = await locator.count(); } catch {}
    let step = '';
    try { step = new URL(url).searchParams.get('step') || ''; } catch {}
    let sub = '';
    try { sub = new URL(url).searchParams.get('sub') || ''; } catch {}
    throw new Error(`[E2E] Missing ${name} (count=${count}) at ${url} step=${step}${sub ? ` sub=${sub}` : ''}`);
  }
}
