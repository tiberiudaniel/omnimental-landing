import { test, expect } from "@playwright/test";
import { go } from "../helpers/env";

test("Smoke: progress root renders", async ({ page }) => {
  await go(page, "/progress?demo=1&e2e=1&lang=ro");

  await expect(page.getByTestId("progress-root")).toBeVisible({ timeout: 20000 });
});
