import { test, expect } from "@playwright/test";

test.skip("books CRUD (Phase 2)", async ({ page }) => {
  await page.goto("/library");
  expect(page).toBeTruthy();
});
