import { test, expect } from "@playwright/test";
import { go } from "../helpers/env";

test("Smoke: guided day1 hero renders", async ({ page }) => {
  await go(page, "/today?mode=guided_day1&source=guided_day1");

  await expect(page.getByTestId("guided-day1-hero")).toBeVisible({ timeout: 20000 });
});

test("Smoke: guided day1 session completion summary", async ({ page }) => {
  await go(page, "/session/complete?source=guided_day1");

  await expect(page.getByTestId("guided-day1-summary")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("guided-day1-summary-continue")).toBeVisible();
});
