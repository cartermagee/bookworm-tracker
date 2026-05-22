import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

// One user per run — sequential tests share this session.
const email = `e2e-books-${Date.now()}@example.com`;
const password = "testpassword";
// Temp file for saved browser storage state (cookies).
const STATE_FILE = path.join(__dirname, ".auth-books.json");

// beforeAll runs at file scope with NO storageState configured yet — a fresh
// context is created here to register and persist the auth cookie to STATE_FILE.
// test.use({ storageState }) is intentionally inside the describe block below
// so it only applies to the actual tests, not to this setup hook.
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Password/).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("/library");
  await page.context().storageState({ path: STATE_FILE });
  await page.close();
});

test.afterAll(() => {
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
});

// test.use() inside a describe block scopes storageState to only these tests —
// it does NOT apply to the beforeAll above, avoiding the chicken-and-egg problem
// where browser.newPage() would try to load a file that doesn't exist yet.
test.describe("authenticated book operations", () => {
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
});
