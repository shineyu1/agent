import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/smoke",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    env: {
      ...process.env,
      APP_ENCRYPTION_KEY:
        process.env.APP_ENCRYPTION_KEY ?? "local-dev-app-encryption-key-for-selleros-x402"
    },
    url: "http://localhost:3100",
    reuseExistingServer: false
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
