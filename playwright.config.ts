import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Setup project - runs first to authenticate and save session
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Auth tests - run WITHOUT authentication state (for login/signup tests)
    {
      name: "chromium-auth",
      testMatch: /auth\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        // No storageState - tests run without authentication
      },
      dependencies: ["setup"],
    },
    {
      name: "firefox-auth",
      testMatch: /auth\.spec\.ts$/,
      use: {
        ...devices["Desktop Firefox"],
        // No storageState - tests run without authentication
      },
      dependencies: ["setup"],
    },
    {
      name: "webkit-auth",
      testMatch: /auth\.spec\.ts$/,
      use: {
        ...devices["Desktop Safari"],
        // No storageState - tests run without authentication
      },
      dependencies: ["setup"],
    },
    {
      name: "Mobile Chrome-auth",
      testMatch: /auth\.spec\.ts$/,
      use: {
        ...devices["Pixel 5"],
        // No storageState - tests run without authentication
      },
      dependencies: ["setup"],
    },
    {
      name: "Mobile Safari-auth",
      testMatch: /auth\.spec\.ts$/,
      use: {
        ...devices["iPhone 12"],
        // No storageState - tests run without authentication
      },
      dependencies: ["setup"],
    },
    // Desktop browsers - use authenticated state (for dashboard, customers, etc.)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // Mobile devices - use authenticated state
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "Mobile Safari",
      use: {
        ...devices["iPhone 12"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // Integration tests - auth flow (runs without auth state)
    {
      name: "integration-auth-flow",
      testMatch: /integration\/auth-flow\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["setup"],
    },
    {
      name: "integration-onboarding-flow",
      testMatch: /integration\/onboarding-flow\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["setup"],
    },
    // Integration tests - authenticated flows
    {
      name: "integration-customer-flow",
      testMatch: /integration\/customer-flow\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "integration-transaction-flow",
      testMatch: /integration\/transaction-flow\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "integration-offline-sync",
      testMatch: /integration\/offline-sync-flow\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "integration-export-flow",
      testMatch: /integration\/export-flow\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
