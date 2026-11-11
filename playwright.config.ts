import { defineConfig, devices } from "@playwright/test";
import { e2eDatabaseUri } from "./e2e/mongo-uri";

const uri = e2eDatabaseUri();
const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next dev --port 3100 --hostname 127.0.0.1",
    url: `${baseURL}/login`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      MONGODB_URI: uri,
      NEXTAUTH_URL: baseURL,
      E2E_DIST_DIR: ".next-e2e",
    },
  },
});
