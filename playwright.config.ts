import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load .env.local for test credentials (TEST_USER_EMAIL, TEST_USER_PASSWORD)
dotenv.config({ path: ".env.local" });

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
      // Exclude auth.spec.ts — chromium-auth project handles it without storageState
      testIgnore: /\/tests\/auth\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      // Only top-level core UI specs — /tests/database/ and /tests/integration/ have dedicated projects
      testMatch:
        /\/tests\/(customers|dashboard|transactions|reports|settings|onboarding|paywall|custom-fields|subscription)\.spec\.ts$/,
      use: {
        ...devices["Desktop Firefox"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      testMatch:
        /\/tests\/(customers|dashboard|transactions|reports|settings|onboarding|paywall|custom-fields|subscription)\.spec\.ts$/,
      use: {
        ...devices["Desktop Safari"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // Mobile devices - use authenticated state, core UI specs only
    {
      name: "Mobile Chrome",
      testMatch:
        /\/tests\/(customers|dashboard|transactions|reports|settings|onboarding|paywall|custom-fields|subscription)\.spec\.ts$/,
      use: {
        ...devices["Pixel 5"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "Mobile Safari",
      testMatch:
        /\/tests\/(customers|dashboard|transactions|reports|settings|onboarding|paywall|custom-fields|subscription)\.spec\.ts$/,
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
    // Smoke tests - run on chromium for speed, covers public routes without auth
    {
      name: "smoke-public",
      testMatch: /smoke\.spec\.ts$/,
      testIgnore: /Smoke Tests - All Modals|Smoke Tests - Navigation|Smoke Tests - Empty States/,
      use: {
        ...devices["Desktop Chrome"],
      },
      // No dependencies - public tests don't need auth setup
    },
    // Smoke tests that require authentication
    {
      name: "smoke-authenticated",
      testMatch: /smoke\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // Performance tests - run on chromium for consistent metrics
    {
      name: "performance",
      testMatch: /performance\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
      },
      // No dependencies - public tests don't need auth setup
    },
    // Performance tests - authenticated
    {
      name: "performance-auth",
      testMatch: /performance\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // Accessibility tests - public pages
    {
      name: "accessibility",
      testMatch: /accessibility\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
      },
      // No dependencies - public tests don't need auth setup
    },
    // Accessibility tests - authenticated pages
    {
      name: "accessibility-auth",
      testMatch: /accessibility\.spec\.ts$/,
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
