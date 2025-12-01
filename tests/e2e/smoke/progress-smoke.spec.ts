import { test, expect } from "@playwright/test";
import { go } from "../helpers/env";

test("Smoke: progress demo loads core cards", async ({ page }) => {
  await go(page, "/progress?demo=1&e2e=1&lang=ro");

  await expect(page.getByTestId("dashboard-kuno-card")).toBeVisible();
  await expect(page.getByText(/OmniAbil/i).first()).toBeVisible();
  await expect(page.getByText(/Daily Reset în 3 pași|Daily Reset/i).first()).toBeVisible();
});
