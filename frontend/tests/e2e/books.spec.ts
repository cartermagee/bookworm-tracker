import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { registerAndSaveState } from "./helpers/auth";

// One user per run — sequential tests share this session.
const email = `e2e-books-${Date.now()}@example.com`;
const password = "testpassword";
// Temp file for saved browser storage state (cookies).
const STATE_FILE = path.join(__dirname, ".auth-books.json");

// Pre-create an empty state file so that browser.newPage() in beforeAll does not
// crash when Playwright loads storageState (configured via test.use below) before
// beforeAll has run. beforeAll immediately overwrites this with real auth data.
fs.writeFileSync(STATE_FILE, JSON.stringify({ cookies: [], origins: [] }));

test.beforeAll(async ({ browser }) => {
  // Register and save the auth cookie so all tests start authenticated.
  await registerAndSaveState(
    await browser.newContext(),
    email,
    password,
    STATE_FILE,
  );
});

test.afterAll(() => {
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
});

// All tests in this file start pre-authenticated via the saved cookie.
test.use({ storageState: STATE_FILE });

test("add a book and see it in the library list", async ({ page }) => {
  await page.goto("/library/new");
  await page.getByLabel("Title *").fill("The Great Gatsby");
  await page.getByLabel("Author *").fill("F. Scott Fitzgerald");
  await page.getByRole("button", { name: "Add Book" }).click();
  await page.waitForURL("/library");
  await expect(page.getByText("The Great Gatsby")).toBeVisible();
});

test("view book detail page", async ({ page }) => {
  await page.goto("/library");
  await page.getByText("The Great Gatsby").first().click();
  await expect(
    page.getByRole("heading", { name: "The Great Gatsby" })
  ).toBeVisible();
  await expect(page.getByText("F. Scott Fitzgerald")).toBeVisible();
});

test("edit a book title", async ({ page }) => {
  await page.goto("/library");
  await page.getByText("The Great Gatsby").first().click();
  await page.getByRole("button", { name: "Edit" }).click();
  const titleInput = page.getByLabel("Title *");
  await titleInput.clear();
  await titleInput.fill("The Great Gatsby (Edited)");
  await page.getByRole("button", { name: "Save Changes" }).click();

  // Debug: capture page state 5 s after clicking Save to diagnose CI failure.
  await page.waitForTimeout(5_000);
  const url = page.url();
  const buttons = await page.getByRole("button").allInnerTexts();
  const headings = await page.getByRole("heading").allInnerTexts();
  const alerts = await page.getByRole("alert").allInnerTexts();
  console.log(`[edit-debug] url=${url}`);
  console.log(`[edit-debug] buttons=${JSON.stringify(buttons)}`);
  console.log(`[edit-debug] headings=${JSON.stringify(headings)}`);
  console.log(`[edit-debug] alerts=${JSON.stringify(alerts)}`);

  await expect(
    page.getByRole("heading", { name: "The Great Gatsby (Edited)" })
  ).toBeVisible();
});

test("delete a book", async ({ page }) => {
  await page.goto("/library");
  await page.getByText("The Great Gatsby (Edited)").first().click();
  // Confirm the native browser dialog triggered by `confirm()` in the delete handler.
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await page.waitForURL("/library");
  await expect(page.getByText("The Great Gatsby")).not.toBeVisible();
});
