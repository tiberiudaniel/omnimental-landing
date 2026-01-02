import { test, expect, type Page } from "@playwright/test";
import { go, resetSession } from "./helpers/env";

function guardConsole(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (/Download the React DevTools/i.test(text)) return;
      throw new Error(`Console error: ${text}`);
    }
  });
}

async function primeOverrides(
  page: Page,
  overrides: { membership?: "free" | "premium"; tier?: number; progress?: Record<string, unknown> } = {},
) {
  const dayKey = new Date().toISOString().split("T")[0];
  const progressOverrides = (() => {
    const baseProgress = overrides.progress ?? {};
    const baseStats = (baseProgress as { stats?: Record<string, unknown> }).stats ?? {};
    return {
      ...baseProgress,
      stats: {
        ...baseStats,
        earnedRounds: { dayKey, credits: 0, usedToday: 0 },
      },
    };
  })();
  const payload = {
    membership: overrides.membership ?? null,
    tier: typeof overrides.tier === "number" ? String(overrides.tier) : null,
    progress: JSON.stringify(progressOverrides),
  };
  await page.addInitScript(({ membership, tier, progress }) => {
    try {
      if (membership) {
        window.localStorage.setItem("e2e_membership_override", membership);
      } else {
        window.localStorage.removeItem("e2e_membership_override");
      }
      if (tier) {
        window.localStorage.setItem("e2e_progress_tier_override", tier);
      } else {
        window.localStorage.removeItem("e2e_progress_tier_override");
      }
      if (progress) {
        window.localStorage.setItem("e2e_progress_override", progress);
      } else {
        window.localStorage.removeItem("e2e_progress_override");
      }
    } catch {
      /* noop */
    }
  }, payload);
  await page.evaluate(
    ({ membership, tier, progress }) => {
      try {
        if (membership) {
          window.localStorage.setItem("e2e_membership_override", membership);
        } else {
          window.localStorage.removeItem("e2e_membership_override");
        }
        if (tier) {
          window.localStorage.setItem("e2e_progress_tier_override", tier);
        } else {
          window.localStorage.removeItem("e2e_progress_tier_override");
        }
        if (progress) {
          window.localStorage.setItem("e2e_progress_override", progress);
        } else {
          window.localStorage.removeItem("e2e_progress_override");
        }
      } catch {
        /* noop */
      }
    },
    payload,
  );
}

async function completeGuidedMindSignals(page: Page) {
  await page.getByRole("link", { name: /încep ghidat/i }).click();
  await page.getByTestId("mindpacing-option-aglomerata").click();
  await page.getByRole("button", { name: /continuă/i }).first().click();
  await page.getByTestId("mindpacing-option-dimineata-inainte-de-lucru").click();
  await page.getByRole("button", { name: /continuă/i }).first().click();
  await page.getByTestId("mindpacing-option-decizii").click();
  await page.getByRole("button", { name: /continuă/i }).first().click();
  await page.getByRole("button", { name: /începem/i }).click();
}

async function completeEarnFlow(page: Page) {
  await go(page, "/today/earn?e2e=1");
  await expect(page.getByTestId("earn-root")).toBeVisible({ timeout: 15000 });
  await page.getByTestId("earn-feedback-not-useful").click();
  await page.getByTestId("earn-commit-breathing").click();
  const submit = page.getByTestId("earn-submit");
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page).toHaveURL(/\/today\/next/, { timeout: 15000 });
}

test.describe("Beta journeys", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
    guardConsole(page);
  });

  test("Guided Day-1 path reaches session complete and returns to Today", async ({ page }) => {
    await primeOverrides(page, { membership: "free", tier: 1, progress: { stats: { dailySessionsCompleted: 1 } } });
    await go(page, "/intro?lang=ro&e2e=1");
    await completeGuidedMindSignals(page);
    await expect(page).toHaveURL(/\/today/, { timeout: 20000 });

    await go(page, "/session/complete?e2e=1");
    await expect(page.getByTestId("session-complete-root")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("session-back-today").click();
    await expect(page).toHaveURL(/\/today\?e2e=1/, { timeout: 15000 });
  });

  test("Explore AXE journey flows back to Today", async ({ page }) => {
    await primeOverrides(page, { membership: "free", tier: 1, progress: { stats: { dailySessionsCompleted: 1 } } });
    await go(page, "/session/complete?e2e=1");
    await expect(page.getByTestId("session-complete-root")).toBeVisible({ timeout: 10000 });

    await go(page, "/intro/explore/axes?e2e=1");
    await expect(page.getByTestId("explore-axes-root")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("explore-axis-item").first().getByRole("button", { name: /explorează/i }).click();
    await expect(page.getByTestId("explore-axis-detail-root")).toBeVisible({ timeout: 15000 });
    const backButtons = page.getByTestId("explore-back-today");
    await backButtons.last().click();
    await expect(page).toHaveURL(/\/today\?e2e=1/, { timeout: 15000 });
  });

  test("Explore CAT-lite journey integrates into session summary", async ({ page }) => {
    const now = new Date().toISOString();
    await primeOverrides(page, {
      membership: "free",
      tier: 2,
      progress: {
        stats: { dailySessionsCompleted: 2 },
        dailyRunner: {
          events: [
            { type: "today_run_completed", at: now },
            { type: "cat_lite_completed", at: now },
          ],
        },
      },
    });
    await go(page, "/session/complete?e2e=1");
    await expect(page.getByTestId("session-complete-root")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/CAT Lite complet/i)).toBeVisible();
  });

  test("Earned rounds enforce daily limit after three completions", async ({ page }) => {
    await primeOverrides(page, { membership: "free", tier: 2, progress: { stats: { dailySessionsCompleted: 2 } } });
    await completeEarnFlow(page);
    await completeEarnFlow(page);
    await completeEarnFlow(page);

    await go(page, "/today/earn?e2e=1");
    await expect(page.getByTestId("earn-limit")).toBeVisible({ timeout: 10000 });
  });
});
