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

test.describe("Intro StepRunner flow", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
    guardConsole(page);
  });

  test("Guided intent runs cinematic → mindpacing → vocab → handoff", async ({ page }) => {
    await go(page, "/intro?e2e=1");

    await page.locator("#intro-choice-guided").click();

    await expect(page.getByTestId("mindpacing-root")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("mindpacing-option-0").click();
    await page.getByTestId("mindpacing-continue").click();

    await expect(page.getByTestId("vocab-root")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("vocab-continue").click();

    await expect(page).toHaveURL(/\/intro\/(guided|explore)/, { timeout: 20_000 });
  });
});
