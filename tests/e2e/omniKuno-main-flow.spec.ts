import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { gotoProgress } from "./helpers/navigation";

const MODULE_ID = "emotional_balance";

async function openOmniKuno(page, moduleId: string) {
  await page.goto(`/omni-kuno?area=${moduleId}&module=${moduleId}`);
  await expect(page.getByTestId("omni-kuno-header"), "OmniKuno header not loaded").toBeVisible();
}

test.describe.skip("OmniKuno main flow (legacy, UX changed)", () => {
  // TODO: realign after initiation/wizard redesign
  test("complete a lesson and return via dashboard", async ({ page }) => {
    await loginAs(page, "demo@omnimental.com");
    await openOmniKuno(page, MODULE_ID);

    const timeline = page.getByTestId("kuno-timeline");
    await expect(timeline).toBeVisible();
    await timeline.getByTestId("kuno-lesson-item").first().getByRole("button").click();

    const lessonView = page.getByTestId("lesson-view");
    await expect(lessonView).toBeVisible();
    while (await page.getByTestId("lesson-next").isVisible()) {
      await page.getByTestId("lesson-next").click();
    }
    await page.getByTestId("lesson-complete").click();

    await gotoProgress(page);
    const dashboardCard = page.getByTestId("dashboard-kuno-card");
    await expect(dashboardCard).toBeVisible();
    await dashboardCard.getByRole("link", { name: /continuă/i }).click();
    await expect(page).toHaveURL(/\/omni-kuno/);
  });
});
