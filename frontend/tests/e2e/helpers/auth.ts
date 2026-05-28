import type { Page, BrowserContext } from "@playwright/test";

/**
 * Register a new user and land on /library.
 * Returns when the /library URL is confirmed.
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Password/).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("/library");
}

/**
 * Log in an existing user and land on /library.
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/library");
}

/**
 * Register a user, save the auth cookie to a file, and close the page.
 * Designed for use in beforeAll hooks.
 */
export async function registerAndSaveState(
  context: BrowserContext,
  email: string,
  password: string,
  stateFile: string,
): Promise<void> {
  const page = await context.newPage();
  await registerUser(page, email, password);
  await context.storageState({ path: stateFile });
  await page.close();
}
