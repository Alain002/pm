import { defineConfig, devices } from "@playwright/test";

// E2E runs against the full stack served by the Docker container on port 8000.
// Start it first with scripts/start.sh or scripts/start.bat.
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  // Serial execution: all tests share the single container database.
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:8000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // Uses the locally installed Microsoft Edge; no browser download needed.
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
});
