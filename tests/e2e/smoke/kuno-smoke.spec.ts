import { test, expect } from "@playwright/test";
import { go } from "../helpers/env";

test("Smoke: OmniKuno root renders", async ({ page }) => {
  await go(page, "/omni-kuno?demo=1&e2e=1&lang=ro");

  await expect(page.getByTestId("kuno-root")).toBeVisible({ timeout: 20000 });
});
