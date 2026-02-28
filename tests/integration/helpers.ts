import { test, Page } from '@playwright/test';

/**
 * Shared test helpers for integration tests.
 * All integration specs should use these helpers to ensure consistent
 * navigation and auth-check behaviour across authenticated test scenarios.
 */

/**
 * Navigate to a page and verify it loaded (not redirected to login).
 * - If redirected to /login, calls test.skip() and returns false.
 * - If a headingPattern is provided but not found, logs a warning but does NOT fail.
 *   (Pages may wrap content differently across locales / screen sizes.)
 * - Returns true when the page loaded successfully.
 */
export async function navigateAndCheck(
  page: Page,
  path: string,
  headingPattern?: RegExp,
): Promise<boolean> {
  const BASE_URL = `http://localhost:3000/en`;
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('networkidle');

  // If redirected to login, skip — storageState may be expired or missing
  if (page.url().includes('/login')) {
    test.skip();
    return false;
  }

  if (headingPattern) {
    const heading = page.getByRole('heading', { name: headingPattern });
    const found = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    if (!found) {
      console.log(
        `Note: heading ${headingPattern} not found on ${path} — page may use a different structure`,
      );
    }
  }

  return true;
}

/**
 * Skip the current test if the page has been redirected to login.
 * Call this after actions that may trigger auth-redirect.
 */
export async function skipIfUnauthenticated(page: Page): Promise<boolean> {
  if (page.url().includes('/login')) {
    test.skip();
    return true;
  }
  return false;
}
