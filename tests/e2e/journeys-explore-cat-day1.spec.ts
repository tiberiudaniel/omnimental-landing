import { test, expect, type Page } from "@playwright/test";
import { go, resetSession } from "./helpers/env";

function guardConsole(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Download the React DevTools/i.test(text)) return;
    throw new Error(`Console error: ${text}`);
  });
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

    await page.waitForURL(/\/today\?/, { timeout: 30_000 });
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
