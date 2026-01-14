import { test, expect, type Page } from "@playwright/test";
import { go, resetSession } from "./helpers/env";
import { getTodayKey } from "../../lib/time/todayKey";

function guardConsole(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (/Download the React DevTools/i.test(text)) return;
      throw new Error(`Console error: ${text}`);
    }
  });
}

test("initiation plan forces module key on today run", async ({ page }) => {
  await resetSession(page);
  guardConsole(page);
  const plan = {
    arcId: null,
    todayKey: getTodayKey(),
    runId: "run-e2e-initiation",
    worldId: "INITIATION",
    mode: "initiation",
    initiationModuleId: "init_clarity_foundations",
    initiationLessonIds: ["clarity_01_illusion_of_clarity"],
    schemaVersion: "initiation_v2_blocks",
  };
  await page.addInitScript(({ storedPlan }) => {
    try {
      sessionStorage.setItem("omnimental:todayPlanV2", storedPlan);
    } catch {}
  }, { storedPlan: JSON.stringify(plan) });
  await go(page, "/today/run?e2e=1");
  await expect(page.getByTestId("initiation-forced-module")).toHaveText(
    "clarity_01_illusion_of_clarity",
  );
});
