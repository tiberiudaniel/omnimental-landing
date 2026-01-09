import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { go, resetSession } from "./helpers/env";
import { ensureTodayBoardVisible, waitForDayOneEntryHero } from "./helpers/today";

type JourneyStep = {
  nodeId?: string;
  urlPattern?: string;
  assertTestId?: string;
  clickTestId?: string;
  gateTag?: string | null;
  tags?: string[] | null;
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
      if (/ERR_NAME_NOT_RESOLVED/i.test(text)) return;
      throw new Error(`Console error: ${text}`);
    }
  });
}

function sanitizeRoutePath(routePath: string | undefined): string {
  if (!routePath) return "/intro";
  const trimmed = routePath.trim();
  if (!trimmed) return "/intro";
  if (trimmed.startsWith("http")) return trimmed;
  const regexChars = trimmed.match(/^([^[()]+?)(?:[\[(]|$)/);
  const candidateRaw = regexChars?.[1]?.trim() ?? trimmed;
  const candidate = candidateRaw.replace(/^\^+/, "").trim();
  if (!candidate) return "/intro";
  return candidate.startsWith("/") ? candidate : `/${candidate}`;
}

function appendE2EParams(routePath: string | undefined): string {
  const targetPath = sanitizeRoutePath(routePath);
  const base = targetPath.startsWith("http")
    ? targetPath
    : `http://placeholder${targetPath.startsWith("/") ? "" : "/"}${targetPath}`;
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
          if (step.clickTestId.startsWith("intro-choice")) {
            const skipButton = page.getByTestId("intro-skip");
            if (await skipButton.count()) {
              await expect(skipButton).toBeVisible({ timeout: 10_000 });
              await skipButton.click();
            }
          }
          const target = page.getByTestId(step.clickTestId);
          await expect(target).toBeVisible({ timeout: 20_000 });
          await target.click();
        }

        if (step.tags?.length) {
          await runStepTags(page, step.tags, journeyName);
        } else if (!step.assertTestId && !step.urlPattern && !step.clickTestId) {
          throw new Error(`Step ${index + 1} in journey ${journeyName} lacks actionable test data.`);
        }

        const currentUrl = page.url();
        if (/\/today\/(run|next)(\?|$)/.test(currentUrl) || /\/guided\/day1/.test(currentUrl)) {
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
async function handleCatLitePartTwo(page: Page) {
  const sliders = page.locator('input[type="range"]');
  const sliderCount = await sliders.count();
  for (let index = 0; index < sliderCount; index += 1) {
    const slider = sliders.nth(index);
    await slider.waitFor({ state: "attached", timeout: 15_000 });
    await slider.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = "7";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
  const saveButton = page.getByRole("button", { name: /Salvează și revino la program/i });
  await expect(saveButton).toBeEnabled({ timeout: 15_000 });
  await Promise.all([
    page.waitForURL(/\/intro\/vocab(.*source=cat-lite.*)$/i, { timeout: 20_000 }),
    saveButton.click(),
  ]);
}

async function handleIntroChoice(page: Page, intent: "guided" | "explore") {
  const testId = intent === "guided" ? "intro-choice-guided" : "intro-choice-explore";
  const directTarget = page.locator(`#${testId}`);
  try {
    await directTarget.waitFor({ state: "visible", timeout: 5_000 });
    await directTarget.click();
    return;
  } catch {
    // fall through and attempt skip
  }
  const skipButton = page.getByTestId("intro-skip").first();
  try {
    await skipButton.waitFor({ state: "visible", timeout: 10_000 });
    await skipButton.click();
  } catch {
    // skip not available; continue
  }
  await directTarget.waitFor({ state: "visible", timeout: 20_000 });
  await directTarget.click();
}

async function handleExploreAxisPick(page: Page) {
  const card = page.getByTestId("explore-axis-item").first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await Promise.all([
    page.waitForURL(/\/intro\/explore\/axes\/[^/?]+/i, { timeout: 20_000 }),
    card.getByRole("button").click(),
  ]);
}

async function handleExploreAxisComplete(page: Page) {
  const finishButton = page.getByRole("button", { name: /Revenim în Today/i }).first();
  await Promise.all([
    page.waitForURL(/\/intro\/explore\/complete(.*source=axes.*)$/i, { timeout: 20_000 }),
    finishButton.click(),
  ]);
}

async function handleExploreCompletionReturn(page: Page, source: "cat-lite" | "axes") {
  const button = page.getByRole("button", { name: /(Înapoi în Today|Back to Today)/i }).first();
  const sourceParam = source === "axes" ? "explore_axes_day1" : "explore_cat_day1";
  await expect(button).toBeVisible({ timeout: 20_000 });
  await Promise.all([
    page.waitForURL(new RegExp(`/today(.*source=${sourceParam}.*)$`, "i"), { timeout: 20_000 }),
    button.click(),
  ]);
}

async function handleSessionCompleteBackToToday(page: Page) {
  let target = page.getByTestId("session-back-today").first();
  if ((await target.count()) === 0) {
    const link = page.getByRole("link", { name: /Înapoi la Today/i }).first();
    const button = page.getByRole("button", { name: /Înapoi la Today/i }).first();
    if ((await link.count()) > 0) target = link;
    else target = button;
  }
  if ((await target.count()) > 0) {
    await expect(target).toBeVisible({ timeout: 20_000 });
    await target.click();
    return;
  }
  const current = new URL(page.url());
  current.pathname = "/today";
  current.searchParams.set("source", "guided_day1");
  if (!current.searchParams.has("mode")) current.searchParams.set("mode", "deep");
  if (!current.searchParams.has("e2e")) current.searchParams.set("e2e", "1");
  await page.goto(current.toString(), { waitUntil: "domcontentloaded" });
}

async function handleExploreCardAction(page: Page, actionTag: "cta_explore_cat_day1" | "cta_explore_axes_day1") {
  const card = page.locator(`[data-action-tag="${actionTag}"]`).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
}

async function runStepTags(page: Page, tags: string[], journeyName: string) {
  for (const tag of tags) {
    switch (tag) {
      case "auto:cat-lite-part2":
        await handleCatLitePartTwo(page);
        break;
      case "auto:intro-choice-guided":
        await handleIntroChoice(page, "guided");
        break;
      case "auto:intro-choice-explore":
        await handleIntroChoice(page, "explore");
        break;
      case "auto:explore-axis-pick":
        await handleExploreAxisPick(page);
        break;
      case "auto:explore-axis-complete":
        await handleExploreAxisComplete(page);
        break;
      case "auto:explore-complete-return-cat-lite":
        await handleExploreCompletionReturn(page, "cat-lite");
        break;
      case "auto:explore-complete-return-axes":
        await handleExploreCompletionReturn(page, "axes");
        break;
      case "auto:session-complete-back-today":
    await handleSessionCompleteBackToToday(page);
    break;
      case "auto:ensure-today-board":
        await ensureTodayBoardReady(page);
        break;
      case "auto:cta_explore_cat_day1":
        await handleExploreCardAction(page, "cta_explore_cat_day1");
        break;
      case "auto:cta_explore_axes_day1":
        await handleExploreCardAction(page, "cta_explore_axes_day1");
        break;
      default:
        console.warn(`[journeys] Journey ${journeyName} has unknown tag ${tag}. Skipping.`);
    }
  }
}
async function ensureTodayBoardReady(page: Page) {
  const hasEntryHero = await waitForDayOneEntryHero(page);
  if (!hasEntryHero) {
    await ensureTodayBoardVisible(page);
    return;
  }
  const currentUrl = new URL(page.url());
  currentUrl.searchParams.set("source", "guided_day1");
  currentUrl.searchParams.set("mode", "deep");
  if (!currentUrl.searchParams.has("e2e")) {
    currentUrl.searchParams.set("e2e", "1");
  }
  await page.goto(currentUrl.toString(), { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/today(.*source=guided_day1.*)$/i, { timeout: 20_000 });
  await ensureTodayBoardVisible(page);
}
