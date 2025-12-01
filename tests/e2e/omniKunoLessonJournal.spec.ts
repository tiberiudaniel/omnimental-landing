import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { go, resetSession } from "./helpers/env";
import { loginAs } from "./helpers/auth";

const TEST_USER = process.env.E2E_USER_EMAIL || "demo@omnimental.com";
const MODULE_ID = "emotional_balance";
const AREA_ID = "emotional_balance";
const LESSON_ID = "emotional_balance_l1_01_foundations";
const LESSON_TITLE = "Fundamente emoționale";

async function openLesson(page: Page) {
  const params = new URLSearchParams({
    area: AREA_ID,
    module: MODULE_ID,
    lang: "ro",
    e2e: "1",
  });
  await go(page, `/omni-kuno?${params.toString()}`);
  const timeline = page.getByTestId("kuno-timeline");
  await expect(timeline).toBeVisible({ timeout: 20000 });
  const lessonView = page.getByTestId("lesson-view");
  if (await lessonView.isVisible().catch(() => false)) {
    return;
  }
  const toggle = page
    .getByTestId("kuno-lesson-trigger")
    .filter({ hasText: LESSON_TITLE })
    .first();
  await toggle.click();
  await expect(lessonView).toBeVisible({ timeout: 20000 });
}

test.describe("OmniKuno lesson journal integration", () => {
  test("note is saved, surfaces in Recent Entries, and deep-link returns to lesson", async ({ page }) => {
    test.setTimeout(120000);
    await resetSession(page);
    await loginAs(page, TEST_USER);
    await openLesson(page);

    const noteText = `Playwright lesson journal ${Date.now()}`;
    await page.getByTestId("lesson-journal-button").click();
    const drawer = page.getByTestId("lesson-journal-drawer");
    await expect(drawer).toBeVisible({ timeout: 10000 });

    const textarea = drawer.getByTestId("lesson-journal-textarea");
    await textarea.fill(noteText);
    await drawer.getByRole("button", { name: /Adaugă în jurnal/i }).click();

    const savedBlock = drawer.getByTestId("lesson-journal-block").filter({ hasText: noteText });
    await expect(savedBlock).toHaveCount(1, { timeout: 15000 });

    await go(page, "/progress?lang=ro&e2e=1");
    const shortNote = noteText.slice(0, 40);

    await expect.poll(
      async () => {
        const texts = await page
          .getByTestId("recent-entry-omnikuno-item")
          .allInnerTexts()
          .catch(() => []);
        return texts.some((text) => text.includes(LESSON_TITLE) && text.includes(shortNote));
      },
      { timeout: 45000, message: "Recent entry did not appear in dashboard" },
    ).toBe(true);

    const omniEntry = page
      .getByTestId("recent-entry-omnikuno-item")
      .filter({ hasText: LESSON_TITLE })
      .filter({ hasText: shortNote });

    await expect(omniEntry).toBeVisible({ timeout: 20000 });

    const entryLink = omniEntry.getByTestId("recent-entry-link").first();
    await entryLink.click();

    await expect(page).toHaveURL(new RegExp(`module=${MODULE_ID}`));
    await expect(page).toHaveURL(new RegExp(`lesson=${LESSON_ID}`));
    await expect(page.getByText(LESSON_TITLE).first()).toBeVisible({ timeout: 15000 });
  });
});
