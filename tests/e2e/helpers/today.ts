import { expect, type Page } from "@playwright/test";
import { getBaseUrl } from "./env";

const TODAY_REGEX = /\/today(\?|$)/i;

export async function waitForDayOneEntryHero(page: Page, detectionTimeout = 5_000): Promise<boolean> {
  const entryHero = page.getByTestId("today-day1-entry");
  try {
    await entryHero.waitFor({ state: "visible", timeout: detectionTimeout });
    return true;
  } catch {
    return entryHero.isVisible();
  }
}

function buildTodayBoardUrl(currentOrigin?: string | null): string {
  const origin = currentOrigin && currentOrigin !== "null" ? currentOrigin : getBaseUrl();
  const url = new URL("/today", origin);
  url.search = "";
  url.searchParams.set("mode", "deep");
  url.searchParams.set("source", "guided_day1");
  url.searchParams.set("e2e", "1");
  return url.toString();
}

export async function ensureTodayBoardVisible(page: Page): Promise<void> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(page.url());
  } catch {
    parsedUrl = new URL(getBaseUrl());
  }
  if (!TODAY_REGEX.test(parsedUrl.pathname + parsedUrl.search)) {
    const target = buildTodayBoardUrl(parsedUrl.origin);
    await page.goto(target, { waitUntil: "domcontentloaded" });
    parsedUrl = new URL(target);
  }
  await expect(page).toHaveURL(TODAY_REGEX, { timeout: 20_000 });
  await expect(page.getByTestId("today-root")).toBeVisible({ timeout: 20_000 });
}
