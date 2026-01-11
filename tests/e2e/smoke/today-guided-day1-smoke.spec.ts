import { test, expect } from "@playwright/test";
import { go, resetSession } from "../helpers/env";

test("Smoke: guided day1 page renders", async ({ page }) => {
  await resetSession(page);
  await go(page, "/today?source=guided_day1&e2e=1&lang=ro");
  await expect(page).toHaveURL(/\/today/, { timeout: 20000 });

  await expect(page.getByTestId("guided-day1-page")).toBeVisible({ timeout: 20000 });
});

test("Smoke: guided day1 session completion summary", async ({ page }) => {
  await resetSession(page);
  await go(page, "/session/complete?source=guided_day1&e2e=1&lang=ro");
  await expect(page).toHaveURL(/\/session\/complete/, { timeout: 20000 });

  await expect(page.getByTestId("guided-day1-summary")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("guided-day1-summary-continue")).toBeVisible();
});
