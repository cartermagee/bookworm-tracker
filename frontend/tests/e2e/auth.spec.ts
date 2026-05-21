import { test, expect } from "@playwright/test";

// Unique email per run — avoids conflicts with leftover rows from previous runs.
const email = `e2e-auth-${Date.now()}@example.com`;
const password = "testpassword";

test("register, reach /library, verify /me, logout, redirect, login again", async ({
  page,
}) => {
  // ── Register ─────────────────────────────────────────────────────────────
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  // Label is "Password (min 8 chars)" — match with regex to be resilient.
  await page.getByLabel(/Password/).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("/library");
  await expect(page.getByText("Your library is empty")).toBeVisible();

  // ── /api/auth/me returns the registered email ─────────────────────────────
  const me = await page.request.get("http://localhost:5000/api/auth/me");
  expect(me.ok()).toBeTruthy();
  const meBody = (await me.json()) as { email: string };
  expect(meBody.email).toBe(email);

  // ── Logout → /login ───────────────────────────────────────────────────────
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("/login");

  // ── After logout /library redirects to /login ─────────────────────────────
  await page.goto("/library");
  await expect(page).toHaveURL(/\/login/);

  // ── Log back in via form → /library ──────────────────────────────────────
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/library");
  await expect(page.getByText("Your library is empty")).toBeVisible();
});
