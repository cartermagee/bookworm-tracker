import { test, expect } from "@playwright/test";
import { registerUser, loginUser } from "./helpers/auth";

// Register one user for the authenticated-stay test.
const email = `e2e-routes-${Date.now()}@example.com`;
const password = "testpassword";

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await registerUser(page, email, password);
  await page.close();
});

test("unauthenticated /library redirects to /login", async ({ page }) => {
  await page.goto("/library");
  await expect(page).toHaveURL(/\/login/);
});

test("unauthenticated /library/new redirects to /login", async ({ page }) => {
  await page.goto("/library/new");
  await expect(page).toHaveURL(/\/login/);
});

test("unauthenticated /library/<uuid> redirects to /login", async ({
  page,
}) => {
  await page.goto("/library/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/login/);
});

test("authenticated user stays on /library", async ({ page }) => {
  await loginUser(page, email, password);
  await expect(page).toHaveURL("/library");
});
