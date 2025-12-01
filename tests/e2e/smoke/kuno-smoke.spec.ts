import { test, expect } from "@playwright/test";
import { go } from "../helpers/env";

test("Smoke: OmniKuno page shows at least one lesson", async ({ page }) => {
  await go(page, "/omni-kuno?demo=1&e2e=1&lang=ro");

  await expect(page.getByTestId("omni-kuno-header")).toBeVisible({ timeout: 20000 });
  const timeline = page.getByTestId("kuno-timeline");
  await expect(timeline).toBeVisible({ timeout: 20000 });
  const lessons = timeline.getByTestId("kuno-lesson-item");
  await expect(lessons.first()).toBeVisible();
});
