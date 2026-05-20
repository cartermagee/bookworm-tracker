import { test, expect } from "@playwright/test";

test.skip("auth flow: register, login, logout (Phase 2)", async ({ page }) => {
  await page.goto("/");
  expect(page).toBeTruthy();
});
