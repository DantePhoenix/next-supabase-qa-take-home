import { defineConfig, devices } from "@playwright/test";

/**
 * SLOWMO (ms) slows every browser action. The default (500) is intentional:
 * several tests call waitForResults() right after fill(), and the debounced
 * request needs a moment to start. Lowering it may make those tests flaky.
 * Example: SLOWMO=1000 pnpm test:e2e:headed
 */
const slowMo = Number(process.env.SLOWMO ?? 500);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: { slowMo },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev:next",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
