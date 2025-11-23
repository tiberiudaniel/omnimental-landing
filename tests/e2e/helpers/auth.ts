import type { Page } from "@playwright/test";
import { go, resetSession } from "./env";

const DEFAULT_AUTH_FALLBACK = "/?e2e=1";

export async function loginAs(page: Page, email: string) {
  await resetSession(page);
  const loginUrl = process.env.E2E_LOGIN_URL;
  if (loginUrl) {
    const separator = loginUrl.includes("?") ? "&" : "?";
    const target = `${loginUrl}${separator}email=${encodeURIComponent(email)}`;
    await go(page, target);
    return;
  }
  // Fallback: visit the site in e2e mode to ensure demo data is available.
  await go(page, DEFAULT_AUTH_FALLBACK);
  await page.evaluate((address) => {
    try {
      window.localStorage.setItem("e2e-demo-user", address);
    } catch {
      /* noop */
    }
  }, email);
}
