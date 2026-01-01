import { test, expect, type Page } from "@playwright/test";
import { go, resetSession } from "./helpers/env";
import { loginAs } from "./helpers/auth";

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
  const payload = {
    membership: overrides.membership ?? null,
    tier: typeof overrides.tier === "number" ? String(overrides.tier) : null,
    progress: overrides.progress ? JSON.stringify(overrides.progress) : null,
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

test.describe("Today session hub flows", () => {
  test.beforeEach(async ({ page }) => {
    await resetSession(page);
    guardConsole(page);
  });

  test("Free user completes guided Day-1 then starts Quick Loop", async ({ page }) => {
    await primeOverrides(page, { membership: "free", tier: 1, progress: { stats: { dailySessionsCompleted: 1 } } });
    await go(page, "/intro?lang=ro&e2e=1");

    await page.getByRole("link", { name: /încep ghidat/i }).click();

    await page.getByTestId("mindpacing-option-aglomerata").click();
    await page.getByRole("button", { name: /continuă/i }).first().click();

    await page.getByTestId("mindpacing-option-dimineata-inainte-de-lucru").click();
    await page.getByRole("button", { name: /continuă/i }).first().click();

    await page.getByTestId("mindpacing-option-decizii").click();
    await page.getByRole("button", { name: /continuă/i }).first().click();

    await page.getByRole("button", { name: /începem/i }).click();
    await expect(page).toHaveURL(/\/today/, { timeout: 20000 });

    await page.getByRole("button", { name: /sesiunea zilnică/i }).click();
    await expect(page).toHaveURL(/\/today\/run/, { timeout: 10000 });
  });

  test("Premium user can launch Deep Loop and Explore portals", async ({ page }) => {
    await primeOverrides(page, { membership: "premium", tier: 2, progress: { stats: { dailySessionsCompleted: 5 } } });
    await go(page, "/today?e2e=1");
    await expect(page.getByText(/Quick Loop/i)).toBeVisible({ timeout: 20000 });

    await page.getByRole("button", { name: /pornește deep loop/i }).click();
    await expect(page).toHaveURL(/\/today\/run/, { timeout: 10000 });

    await go(page, "/today?e2e=1");
    await page.getByRole("button", { name: /intră în/i }).click();
    await expect(page).toHaveURL(/\/progress/, { timeout: 10000 });
  });

  test("Wizard entry provides return path to Today", async ({ page }) => {
    await loginAs(page, "wizard-e2e@omnimental.com");
    await primeOverrides(page, { membership: "premium", progress: { stats: { dailySessionsCompleted: 5 } } });
    await go(page, "/wizard?e2e=1");
    await expect(page.getByText(/deblochează configuratorul/i)).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: /înapoi la \/today/i }).click();
    await expect(page).toHaveURL(/\/today/, { timeout: 10000 });
  });

  test("MindPacing signal persists after refresh", async ({ page }) => {
    await primeOverrides(page, { membership: "free", progress: { stats: { dailySessionsCompleted: 0 } } });
    await go(page, "/intro/mindpacing?lang=ro&e2e=1");
    await page.getByTestId("mindpacing-option-aglomerata").click();
    await expect(page.getByText(/ai ales/i)).toContainText("Aglomerată");
    await page.reload();
    await expect(page.getByText(/ai ales/i)).toContainText("Aglomerată");
  });
});
