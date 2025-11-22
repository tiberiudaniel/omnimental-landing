import { test, expect } from "@playwright/test";
import { go, resetSession } from "./helpers/env";

test.describe("OmniKuno lesson progression", () => {
  test("user can finish a lesson and auto-selects next", async ({ page }) => {
    await resetSession(page);
    await go(page, "/omni-kuno?e2e=1&lang=ro");
    await expect(page.getByTestId("omni-kuno-header")).toBeVisible();

    const timeline = page.getByTestId("kuno-timeline");
    await expect(timeline).toBeVisible();
    const firstLesson = timeline.getByTestId("kuno-lesson-item").first();
    await firstLesson.getByRole("button").click();
    await expect(page.getByTestId("lesson-view")).toBeVisible();

    while (await page.getByTestId("lesson-next").isVisible().catch(() => false)) {
      const reflectionInput = page.getByTestId("lesson-view").locator("textarea");
      if (await reflectionInput.isVisible().catch(() => false)) {
        await reflectionInput.fill("test test test");
      }
      await page.getByTestId("lesson-next").click();
    }

    await page.getByTestId("lesson-complete").click();

    await expect(firstLesson.getByText("✓")).toBeVisible({ timeout: 10000 });
    const secondLesson = timeline.getByTestId("kuno-lesson-item").nth(1);
    await expect(secondLesson.getByText("▶")).toBeVisible({ timeout: 10000 });
  });
});
