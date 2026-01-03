import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { go, resetSession } from "./helpers/env";

type JourneyStep = {
  nodeId?: string;
  urlPattern?: string;
  assertTestId?: string;
  clickTestId?: string;
};

type JourneySpec = {
  id: string;
  name?: string;
  status?: string;
  entryRoutePath?: string;
  exitRoutePath?: string;
  steps?: JourneyStep[];
};

type JourneySpecFile = {
  generatedAt?: string;
  flowId?: string;
  flowName?: string;
  journeys?: JourneySpec[];
};

const JOURNEY_FILE = process.env.FLOW_JOURNEYS_FILE?.trim() || "tests/e2e/fixtures/journeys.json";

function loadJourneys(): { filePath: string; journeys: JourneySpec[] } {
  const resolved = path.resolve(process.cwd(), JOURNEY_FILE);
  if (!fs.existsSync(resolved)) {
    console.warn(`[journeys] Spec file missing at ${resolved}.`);
    return { filePath: resolved, journeys: [] };
  }
  try {
    const raw = fs.readFileSync(resolved, "utf-8");
    const parsed = JSON.parse(raw) as JourneySpecFile;
    if (!Array.isArray(parsed.journeys)) {
      console.warn(`[journeys] Spec file ${resolved} has no journeys array.`);
      return { filePath: resolved, journeys: [] };
    }
    return { filePath: resolved, journeys: parsed.journeys };
  } catch (error) {
    console.error(`[journeys] Failed to parse ${resolved}:`, error);
    return { filePath: resolved, journeys: [] };
  }
}

function guardConsole(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (/Download the React DevTools/i.test(text)) return;
      if (/FIRESTORE.*INTERNAL ASSERTION FAILED/i.test(text)) return;
      if (/INTERNAL UNHANDLED ERROR/i.test(text) && /INTERNAL ASSERTION FAILED/i.test(text)) return;
      if (/Unexpected state \(ID:/.test(text) && /@firebase\/firestore/i.test(text)) return;
      throw new Error(`Console error: ${text}`);
    }
  });
}

function appendE2EParams(routePath: string | undefined): string {
  const targetPath = routePath?.trim() ? routePath.trim() : "/intro";
  const base = targetPath.startsWith("http") ? targetPath : `http://placeholder${targetPath.startsWith("/") ? "" : "/"}${targetPath}`;
  const url = new URL(base);
  url.searchParams.set("e2e", "1");
  if (!url.searchParams.has("lang")) {
    url.searchParams.set("lang", "ro");
  }
  const finalPath = url.pathname + (url.search ? url.search : "") + (url.hash ?? "");
  return targetPath.startsWith("http") ? url.toString() : finalPath;
}

function toRegExp(pattern: string): RegExp {
  try {
    return new RegExp(pattern);
  } catch (error) {
    throw new Error(`Invalid URL pattern '${pattern}': ${error instanceof Error ? error.message : String(error)}`);
  }
}

const { filePath: journeysFilePath, journeys } = loadJourneys();
const activeJourneys = journeys.filter((journey) => (journey.status ?? "draft") === "active" && (journey.steps?.length ?? 0) > 0);

if (!activeJourneys.length) {
  console.warn(`[journeys] No active journeys found in ${journeysFilePath}. Flow Studio journeys spec tests will be skipped.`);
}

const describeJourneys = activeJourneys.length ? test.describe : test.describe.skip;

describeJourneys("Flow Studio journeys", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
    guardConsole(page);
  });

  for (const journey of activeJourneys) {
    const journeyName = journey.name || journey.id;
    test(`Journey: ${journeyName}`, async ({ page }) => {
      const entryUrl = appendE2EParams(journey.entryRoutePath);
      await go(page, entryUrl);

      for (const [index, step] of (journey.steps ?? []).entries()) {
        if (step.urlPattern) {
          const pattern = toRegExp(step.urlPattern);
          await expect(page).toHaveURL(pattern, { timeout: 20_000 });
        }
        if (step.assertTestId) {
          await expect(page.getByTestId(step.assertTestId)).toBeVisible({ timeout: 20_000 });
        }
        if (step.clickTestId) {
          const target = page.getByTestId(step.clickTestId);
          await expect(target).toBeVisible({ timeout: 20_000 });
          await target.click();
        } else if (!step.assertTestId && !step.urlPattern) {
          throw new Error(`Step ${index + 1} in journey ${journeyName} lacks actionable test data.`);
        }

        if (/\/today\/(run|next)(\?|$)/.test(page.url())) {
          const finishButton = page.getByTestId("session-finish-button");
          await expect(finishButton).toBeVisible({ timeout: 20_000 });
          await Promise.all([
            page.waitForURL(/\/session\/complete(.*)$/, { timeout: 20_000 }),
            finishButton.click(),
          ]);
        }
      }

      if (journey.exitRoutePath) {
        const exitPattern = toRegExp(journey.exitRoutePath);
        await expect(page).toHaveURL(exitPattern, { timeout: 20_000 });
      }
    });
  }
});
