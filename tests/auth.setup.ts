import { test as setup, expect } from '@playwright/test';

/**
 * Playwright Auth Setup
 *
 * This file authenticates once and saves the session state to a file.
 * All authenticated tests can then reuse this session, avoiding the need
 * to log in for each test file.
 *
 * The session state includes cookies and localStorage which Supabase uses
 * to maintain authentication.
 *
 * Usage:
 * 1. This runs automatically before tests that depend on 'authenticated' setup
 * 2. Run manually: npx playwright test tests/auth.setup.ts
 */

const AUTH_FILE = 'playwright/.auth/user.json';

// Test credentials from fix_plan.md
const TEST_EMAIL = 'temreyildirim8@gmail.com';
const TEST_PASSWORD = 'Roamless123*';
const TEST_LOCALE = 'en';
const BASE_URL = `http://localhost:3000/${TEST_LOCALE}`;

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto(`${BASE_URL}/login`);

  // Wait for the login form to be visible
  await expect(page.getByLabel(/email/i)).toBeVisible();

  // Fill in credentials
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);

  // Submit the form
  await page.getByRole('button', { name: /sign in|login|submit/i }).click();

  // Wait for successful authentication - either redirect to dashboard or onboarding
  // The app redirects to dashboard if onboarding is complete, or onboarding if not
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });

  // Wait a moment for auth state to fully propagate
  await page.waitForTimeout(2000);

  // Verify we're authenticated by checking for user-specific elements
  // Either sidebar (dashboard) or onboarding content should be visible
  const isOnDashboard = page.url().includes('/dashboard');
  const isOnOnboarding = page.url().includes('/onboarding');

  // We should be on either dashboard or onboarding (both indicate successful auth)
  expect(isOnDashboard || isOnOnboarding).toBe(true);

  // If on onboarding, we might need to complete it first
  // For now, we save the session as-is - tests can handle onboarding state

  // Save authentication state
  await page.context().storageState({ path: AUTH_FILE });

  console.log(`✅ Authentication state saved to ${AUTH_FILE}`);
});
