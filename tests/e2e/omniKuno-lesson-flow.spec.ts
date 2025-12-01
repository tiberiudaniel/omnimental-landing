import { test, expect } from "@playwright/test";
import { go, resetSession } from "./helpers/env";
import { loginAs } from "./helpers/auth";

test.describe.skip("OmniKuno lesson progression (legacy, UX changed)", () => {
  // TODO: realign after initiation/wizard redesign
  test("user can finish a lesson and auto-selects next", async ({ page }) => {
    await resetSession(page);
    await loginAs(page, "demo@omnimental.com");
    await go(page, "/omni-kuno?area=emotional_balance&module=emotional_balance&e2e=1&lang=ro");
    await expect(page.getByTestId("omni-kuno-header")).toBeVisible();

    const timeline = page.getByTestId("kuno-timeline");
    await expect(timeline).toBeVisible({ timeout: 20000 });
    const lessonItems = timeline.getByTestId("kuno-lesson-item");
    const firstLesson = lessonItems.first();
    await firstLesson.getByTestId("kuno-lesson-trigger").click();
    const lessonView = page.getByTestId("lesson-view");
    await expect(lessonView).toBeVisible();

    while (await page.getByTestId("lesson-next").isVisible().catch(() => false)) {
      const reflectionInput = lessonView.locator("textarea");
      if (await reflectionInput.isVisible().catch(() => false)) {
        await reflectionInput.fill("test test test");
      }
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="lesson-next"]') as HTMLButtonElement | null;
        btn?.click();
      });
      await page.waitForTimeout(200);
    }

    const completeButton = page.getByRole("button", {
      name: /Lecție completă|Lesson saved|Marchează lecția ca finalizată|Mark lesson as done/i,
    });
    if (await completeButton.isVisible().catch(() => false)) {
      await completeButton.click();
    }

    const secondLesson = lessonItems.nth(1);
    await expect(secondLesson).toHaveAttribute("data-active", "true", { timeout: 10000 });
  });
});
