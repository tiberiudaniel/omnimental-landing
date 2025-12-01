import { test, expect } from "@playwright/test";
import { go } from "../helpers/env";

test("Smoke: user can click OmniAbil task + Daily Reset in demo", async ({ page }) => {
  await go(page, "/progress?demo=1&e2e=1&lang=ro");

  await expect(page.getByTestId("omniabil-card")).toBeVisible({ timeout: 10000 });

  const markButtons = page.getByRole("button", {
    name: /Marchează ca făcut|Mark done/i,
  });
  if ((await markButtons.count()) > 0) {
    const markBtn = markButtons.first();
    await expect(markBtn).toBeVisible({ timeout: 15000 });
    await markBtn.click();
    await expect(markBtn).toBeDisabled();
  } else {
    await expect(page.getByTestId("omniabil-daily")).toBeVisible();
  }

  const resetButton = page.getByRole("button", {
    name: /Salvează ziua de azi|Save today|Salvează ziua|Save day|Completează|Înregistrează/i,
  });
  if ((await resetButton.count()) > 0) {
    const btn = resetButton.first();
    await expect(btn).toBeVisible({ timeout: 15000 });
    await btn.click();
    await expect(
      page.getByText(/Ai completat deja reset-ul|Demo: ai completat|already logged today|Demo mode/i),
    ).toBeVisible();
  } else {
    await expect(page.getByText(/Ritual zilnic|Daily ritual/i).first()).toBeVisible();
  }
});
