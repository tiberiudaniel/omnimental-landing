import { test, expect, type Page } from "@playwright/test";
import { go, resetSession } from "./helpers/env";
import { getTodayKey } from "../../lib/time/todayKey";

function guardConsole(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Download the React DevTools/i.test(text)) return;
    throw new Error(`Console error: ${text}`);
  });
}

const CORE_LESSON = "clarity_01_illusion_of_clarity";
const ELECTIVE_LESSON = "clarity_single_intent";

test.describe("Initiation block runtime", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
    guardConsole(page);
  });

  test("executes core → elective → recall blocks in order", async ({ page }) => {
    const runId = "run-block-seq";
    const plan = {
      arcId: null,
      todayKey: getTodayKey(),
      runId,
      worldId: "INITIATION",
      mode: "initiation",
      initiationModuleId: "init_clarity_foundations",
      initiationLessonIds: [CORE_LESSON, ELECTIVE_LESSON],
      initiationBlocks: [
        { kind: "core_lesson", lessonId: CORE_LESSON },
        { kind: "elective_practice", lessonId: ELECTIVE_LESSON, reason: "module_pool" },
        {
          kind: "recall",
          prompt: {
            promptId: "generic_checkin",
            question: "Ce regulă aplici azi?",
            microAction: "Scrie regula în agenda ta.",
          },
        },
      ],
      initiationRecallPromptId: "generic_checkin",
      initiationElectiveReason: "module_pool",
      schemaVersion: "initiation_v2_blocks",
    };
    await page.addInitScript(({ storedPlan, runStateKey, schemaVersion }) => {
      try {
        sessionStorage.clear();
        sessionStorage.setItem(
          "omnimental:todayPlanV2",
          JSON.stringify({ ...JSON.parse(storedPlan), schemaVersion }),
        );
        sessionStorage.removeItem(runStateKey);
      } catch {}
    }, { storedPlan: JSON.stringify(plan), runStateKey: `omnimental:initiationRunState:${runId}`, schemaVersion: "initiation_v2_blocks" });
    await go(page, "/today/run?e2e=1");
    await expect(page).toHaveURL(/\/today\/run\?e2e=1/i);
    await expect(page.getByTestId("today-run-root")).toBeVisible();
    const sentinel = page.getByTestId("initiation-forced-module");
    await expect(sentinel).not.toHaveText("NO_PLAN");
    await expect(sentinel).toHaveText(CORE_LESSON);
    await page.getByTestId("initiation-block-debug-complete").click();
    await expect(page.getByTestId("initiation-forced-module")).toHaveText(ELECTIVE_LESSON);
    await page.getByTestId("initiation-block-debug-complete").click();
    const recallSection = page.getByTestId("initiation-recall-block");
    await expect(recallSection).toBeVisible();
    await page.getByTestId("recall-answer-input").fill("Scriu regula în notițe.");
    await page.getByTestId("recall-micro-checkbox").check();
    await page.getByTestId("recall-complete").click();
    await expect(page).toHaveURL(/\/session\/complete/i);
  });

  test("skips elective when plan has only core and recall blocks", async ({ page }) => {
    const runId = "run-block-core-recall";
    const plan = {
      arcId: null,
      todayKey: getTodayKey(),
      runId,
      worldId: "INITIATION",
      mode: "initiation",
      initiationModuleId: "init_clarity_foundations",
      initiationLessonIds: [CORE_LESSON],
      initiationBlocks: [
        { kind: "core_lesson", lessonId: CORE_LESSON },
        {
          kind: "recall",
          prompt: {
            promptId: "generic_micro_action",
            question: "Care e micro-acțiunea azi?",
          },
        },
      ],
      initiationRecallPromptId: "generic_micro_action",
      schemaVersion: "initiation_v2_blocks",
    };
    await page.addInitScript(({ storedPlan, runStateKey, schemaVersion }) => {
      try {
        sessionStorage.clear();
        sessionStorage.setItem(
          "omnimental:todayPlanV2",
          JSON.stringify({ ...JSON.parse(storedPlan), schemaVersion }),
        );
        sessionStorage.removeItem(runStateKey);
      } catch {}
    }, { storedPlan: JSON.stringify(plan), runStateKey: `omnimental:initiationRunState:${runId}`, schemaVersion: "initiation_v2_blocks" });
    await go(page, "/today/run?e2e=1");
    await expect(page).toHaveURL(/\/today\/run\?e2e=1/i);
    await expect(page.getByTestId("today-run-root")).toBeVisible();
    const sentinel = page.getByTestId("initiation-forced-module");
    await expect(sentinel).not.toHaveText("NO_PLAN");
    await expect(sentinel).toHaveText(CORE_LESSON);
    await page.getByTestId("initiation-block-debug-complete").click();
    await expect(page.getByTestId("initiation-recall-block")).toBeVisible();
    await page.getByTestId("recall-answer-input").fill("Aplic regula imediat după run.");
    await page.getByTestId("recall-complete").click();
    await expect(page).toHaveURL(/\/session\/complete/i);
  });
});
