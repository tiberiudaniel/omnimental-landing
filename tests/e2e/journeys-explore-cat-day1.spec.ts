import { test, expect, type Page } from "@playwright/test";
import { go, resetSession } from "./helpers/env";
import { ensureTodayBoardVisible, waitForDayOneEntryHero } from "./helpers/today";

function guardConsole(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Download the React DevTools/i.test(text)) return;
    if (/FIRESTORE.*INTERNAL ASSERTION FAILED/i.test(text)) return;
    if (/Unexpected state \(ID:/.test(text) && /@firebase\/firestore/i.test(text)) return;
    throw new Error(`Console error: ${text}`);
  });
}

async function ensureTodayBoardAfterIntro(page: Page) {
  const hasEntryHero = await waitForDayOneEntryHero(page);
  if (!hasEntryHero) {
    // Already on the full board; ensure we’re on Today to avoid racing redirects.
    await ensureTodayBoardVisible(page);
    return;
  }
  const guidedStart = page.getByTestId("guided-day1-start");
  await expect(guidedStart).toBeVisible({ timeout: 20_000 });
  await Promise.all([
    page.waitForURL(/\/today\/run(.*lane=guided_day1.*)$/i, { timeout: 30_000 }),
    guidedStart.click(),
  ]);
  await expect(page.getByTestId("guided-day1-e2e")).toBeVisible({ timeout: 20_000 });
  await Promise.all([
    page.waitForURL(/\/session\/complete(.*lane=guided_day1.*)$/i, { timeout: 30_000 }),
    page.getByTestId("session-finish-button").click(),
  ]);
  const backToToday = page.getByTestId("session-back-today").first();
  await expect(backToToday).toBeVisible({ timeout: 20_000 });
  await Promise.all([
    page.waitForURL(/\/today\?/, { timeout: 30_000 }),
    backToToday.click(),
  ]);
  await ensureTodayBoardVisible(page);
}

test.describe("Explore CAT Day1 journey", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
    guardConsole(page);
  });

  test("runs Intro → Today → Explore CAT and returns to Today deep", async ({ page }) => {
    await go(page, "/intro?e2e=1");

    await page.locator("#intro-choice-explore").click();

    await expect(page.getByTestId("mindpacing-root")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("mindpacing-option-0").click();
    await page.getByTestId("mindpacing-continue").click();

    await expect(page.getByTestId("vocab-root")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("vocab-continue").click();

    await page.waitForURL(/\/today\?/, { timeout: 30_000 });
    const introUrl = new URL(page.url());
    expect(introUrl.searchParams.get("mode")).toBe("deep");
    expect(introUrl.searchParams.get("source")).toBe("intro");
    expect(introUrl.searchParams.get("intent")).toBe("explore");

    await ensureTodayBoardAfterIntro(page);
    await page.getByTestId("today-explore-cat").click();

    await page.waitForURL(/\/intro\/explore/, { timeout: 30_000 });
    await page.getByTestId("explore-card-cat-lite").click();

    await page.waitForURL(/\/onboarding\/cat-lite-2/, { timeout: 30_000 });
    const sliders = page.locator('input[type="range"]');
    const sliderCount = await sliders.count();
    for (let i = 0; i < sliderCount; i += 1) {
      const slider = sliders.nth(i);
      await slider.waitFor({ state: "visible", timeout: 15_000 });
      await slider.evaluate((el) => {
        const node = el as HTMLInputElement;
        node.value = "7";
        node.dispatchEvent(new Event("input", { bubbles: true }));
        node.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
    await page.getByRole("button", { name: /Salvează și revino la program/i }).click();

    await expect(page.getByTestId("vocab-root")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("vocab-continue").click();

    await page.waitForURL(/\/intro\/explore\/complete(.*source=cat-lite.*)$/i, { timeout: 30_000 });
    const returnButton = page.getByRole("button", { name: /(Înapoi în Today|Back to Today)/i }).first();
    await expect(returnButton).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL(/\/today\?/, { timeout: 30_000 }),
      returnButton.click(),
    ]);
    const finalUrl = new URL(page.url());
    expect(finalUrl.searchParams.get("mode")).toBe("deep");
    expect(finalUrl.searchParams.get("source")).toBe("explore_cat_day1");
    expect(finalUrl.searchParams.get("e2e")).toBe("1");
  });

  test("keeps Explore Hub visible before CAT Lite and does not auto-redirect", async ({ page }) => {
    await go(page, "/intro?e2e=1");

    await page.locator("#intro-choice-explore").click();

    await expect(page.getByTestId("mindpacing-root")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("mindpacing-option-0").click();
    await page.getByTestId("mindpacing-continue").click();

    await expect(page.getByTestId("vocab-root")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("vocab-continue").click();

    await page.waitForURL(/\/today\?/, { timeout: 30_000 });
    await ensureTodayBoardAfterIntro(page);
    await page.getByTestId("today-explore-cat").click();

    await page.waitForURL(/\/intro\/explore/, { timeout: 30_000 });
    await expect(page.getByTestId("explore-card-cat-lite")).toBeVisible();
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/\/intro\/explore/);

    await page.getByTestId("explore-card-cat-lite").click();
    await page.waitForURL(/\/intro\/explore\/cat-lite/, { timeout: 30_000 });
    await page.waitForURL(/\/onboarding\/cat-lite-2/, { timeout: 30_000 });
  });
});
