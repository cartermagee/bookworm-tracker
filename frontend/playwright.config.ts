import { defineConfig, devices } from "@playwright/test";
import path from "path";

// Hardcoded test-only secret — not a production value. Min 32 bytes required by the backend fail-fast guard.
const E2E_JWT_SECRET = "e2e-test-secret-at-least-thirty-two-bytes-ok";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // multi-tenancy tests share users; keep serial.
  workers: 1,          // single SQLite DB — concurrent writers cause lock contention.
  timeout: 60_000,     // CI runners are slow; default 30 s is too tight.
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    // Emulate prefers-reduced-motion: reduce so Framer Motion (via MotionConfig)
    // skips animations and jumps to final state — prevents opacity-0 timing
    // failures in headless Chromium where requestAnimationFrame is throttled.
    contextOptions: {
      reducedMotion: "reduce",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      // Backend: start with a dedicated E2E SQLite DB so tests don't touch the dev DB.
      // --no-build assumes the backend is pre-built (CI does this; local devs can omit the flag).
      command: "dotnet run --project BookTracker.Api --no-build",
      cwd: path.join(__dirname, "../backend"),
      url: "http://localhost:5000/health",
      reuseExistingServer: !process.env["CI"],
      timeout: 60_000,
      env: {
        ASPNETCORE_ENVIRONMENT: "Development",
        Jwt__Secret: E2E_JWT_SECRET,
        Jwt__Issuer: "bookworm-tracker",
        Jwt__Audience: "bookworm-tracker",
        // Absolute path avoids ambiguity over which directory dotnet run treats as cwd.
        ConnectionStrings__Default: "Data Source=/tmp/booktracker-e2e.db",
      },
    },
    {
      command: "pnpm dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env["CI"],
      timeout: 30_000,
    },
  ],
});
