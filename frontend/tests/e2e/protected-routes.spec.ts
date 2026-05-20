import { test, expect } from "@playwright/test";

test.skip("unauthenticated user is redirected from /library (Phase 2)", async ({ page }) => {
  await page.goto("/library");
  await expect(page).toHaveURL(/login/);
});
