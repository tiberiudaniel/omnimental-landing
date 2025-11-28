import { test, expect } from "@playwright/test";

test.describe("Progress authentication flow", () => {
  test("redirects unauthenticated visitors to /auth", async ({ page }) => {
    await page.goto("/progress");
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator("body")).toContainText(/Autentificare|Sign in/);
  });

  test.skip("allows OTP sign-in and shows dashboard", async ({ page }) => {
    // TODO: implement once OTP helper endpoints are available for tests.
    // Steps (rough sketch):
    // 1. Request an OTP for a disposable email.
    // 2. Retrieve the code from test mailbox or a mock endpoint.
    // 3. POST to /api/auth/verify-code, obtain custom token, and sign in via client-side script.
    // 4. Navigate to /progress and assert dashboard widgets render without errors.
    await page.goto("/auth");
    await page.pause();
  });
});

