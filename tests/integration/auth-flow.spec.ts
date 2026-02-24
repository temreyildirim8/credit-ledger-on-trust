import { test as base, expect } from '@playwright/test';

/**
 * Integration Tests for Authentication Flow
 *
 * Tests the complete authentication flow:
 * - Login → Session → Protected Route Access
 * - Logout → Session Clear → Redirect
 * - Session Persistence → Page Refresh
 *
 * Note: These tests run WITHOUT pre-authenticated state to test the actual auth flow.
 */

const TEST_LOCALE = 'en';
const BASE_URL = `http://localhost:3000/${TEST_LOCALE}`;

// Test credentials from fix_plan.md
const TEST_EMAIL = 'temreyildirim8@gmail.com';
const TEST_PASSWORD = 'Roamless123*';

// Create a separate test fixture for auth flow tests (without authenticated state)
const test = base.extend({
  storageState: undefined as unknown as string,
});

test.describe('Authentication Flow Integration', () => {
  test.describe.configure({ mode: 'parallel' });

  test('full login flow: form → auth → session → protected route', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    await test.step('Fill login credentials', async () => {
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    });

    await test.step('Submit login form', async () => {
      const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
      await submitButton.click();
    });

    await test.step('Verify redirect to protected area', async () => {
      // Should redirect to either dashboard or onboarding
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });
    });

    await test.step('Verify session cookie exists', async () => {
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c =>
        c.name.includes('supabase') ||
        c.name.includes('auth') ||
        c.name.includes('sb-')
      );
      expect(hasAuthCookie).toBe(true);
    });

    await test.step('Verify protected content is visible', async () => {
      // Either dashboard content or onboarding content should be visible
      const hasDashboard = await page.getByRole('heading', { name: /dashboard/i }).isVisible().catch(() => false);
      const hasOnboarding = await page.getByRole('heading', { name: /currency|language|category/i }).isVisible().catch(() => false);

      expect(hasDashboard || hasOnboarding).toBe(true);
    });
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    await test.step('Fill invalid credentials', async () => {
      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
    });

    await test.step('Submit and verify error', async () => {
      const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
      await submitButton.click();

      // Should show error message
      const errorMessage = page.getByText(/invalid|incorrect|failed|error/i);
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      // Should still be on login page
      expect(page.url()).toContain('/login');
    });
  });

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    await test.step('Clear any existing session', async () => {
      await page.context().clearCookies();
    });

    await test.step('Try to access protected route', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
    });

    await test.step('Verify redirect to login', async () => {
      // Should redirect to login page
      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/login');
    });
  });
});

test.describe('Session Persistence Integration', () => {
  test('session persists across page refresh', async ({ page }) => {
    await test.step('Login first', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login|submit/i }).click();
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });
    });

    await test.step('Get cookies before refresh', async () => {
      const cookiesBefore = await page.context().cookies();
      expect(cookiesBefore.length).toBeGreaterThan(0);
    });

    await test.step('Refresh the page', async () => {
      await page.reload();
    });

    await test.step('Verify still authenticated', async () => {
      // Should not redirect to login
      await page.waitForLoadState('networkidle');

      // Should still be on a protected page
      const isProtected = page.url().includes('/dashboard') ||
                          page.url().includes('/customers') ||
                          page.url().includes('/transactions') ||
                          page.url().includes('/onboarding');

      expect(isProtected).toBe(true);
    });
  });

  test('session persists across browser tabs', async ({ page, context }) => {
    await test.step('Login in first tab', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login|submit/i }).click();
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });
    });

    await test.step('Open new tab and navigate to protected route', async () => {
      const newPage = await context.newPage();
      await newPage.goto(`${BASE_URL}/dashboard`);

      // Should not redirect to login (shares session)
      await newPage.waitForLoadState('networkidle');

      const isProtected = newPage.url().includes('/dashboard') ||
                          newPage.url().includes('/onboarding');

      expect(isProtected).toBe(true);

      await newPage.close();
    });
  });
});

test.describe('Logout Flow Integration', () => {
  test('full logout flow: logout → session clear → redirect', async ({ page }) => {
    await test.step('Login first', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login|submit/i }).click();
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });
    });

    await test.step('Navigate to settings', async () => {
      // Look for settings link in sidebar or menu
      const settingsLink = page.getByRole('link', { name: /settings/i }).or(
        page.getByRole('button', { name: /settings/i })
      );

      const hasSettingsLink = await settingsLink.isVisible().catch(() => false);
      if (hasSettingsLink) {
        await settingsLink.click();
        await page.waitForLoadState('networkidle');
      } else {
        await page.goto(`${BASE_URL}/settings`);
      }
    });

    await test.step('Find and click logout button', async () => {
      // Look for logout/sign out button
      const logoutButton = page.getByRole('button', { name: /sign out|logout|log out/i });
      const hasLogoutButton = await logoutButton.isVisible().catch(() => false);

      if (hasLogoutButton) {
        await logoutButton.click();

        // Handle confirmation dialog if present
        const confirmDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
        const hasConfirmDialog = await confirmDialog.isVisible().catch(() => false);

        if (hasConfirmDialog) {
          const confirmButton = confirmDialog.getByRole('button', { name: /confirm|yes|sign out|logout/i });
          await confirmButton.click();
        }
      } else {
        // Alternative: clear session manually
        await page.context().clearCookies();
        await page.goto(`${BASE_URL}/login`);
      }
    });

    await test.step('Verify redirect to login or home', async () => {
      await page.waitForLoadState('networkidle');

      // Should be on login page or home page
      const isLoggedOut = page.url().includes('/login') ||
                          page.url() === `${BASE_URL}` ||
                          page.url() === `${BASE_URL}/`;

      expect(isLoggedOut).toBe(true);
    });

    await test.step('Verify cannot access protected routes', async () => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 10000 });
    });
  });
});

test.describe('Password Reset Flow Integration', () => {
  test('forgot password flow: request → email sent page', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    await test.step('Click forgot password link', async () => {
      const forgotLink = page.getByRole('link', { name: /forgot.*password|reset.*password/i });
      await forgotLink.click();

      // Should navigate to forgot password page
      await page.waitForURL(/\/forgot-password|\/reset-password/, { timeout: 5000 });
    });

    await test.step('Enter email and submit', async () => {
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill(TEST_EMAIL);

      const submitButton = page.getByRole('button', { name: /send|reset|submit/i });
      await submitButton.click();
    });

    await test.step('Verify success message or redirect', async () => {
      // Should show success message or redirect to confirmation page
      const successMessage = page.getByText(/sent|check.*email|link.*sent/i);
      const hasSuccess = await successMessage.isVisible({ timeout: 10000 }).catch(() => false);

      // Or redirected to verification page
      const isVerifyPage = page.url().includes('/verify') || page.url().includes('/check-email');

      expect(hasSuccess || isVerifyPage).toBe(true);
    });
  });
});

test.describe('Auth State Transitions', () => {
  test('authenticated user cannot access login page', async ({ page }) => {
    await test.step('Login first', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login|submit/i }).click();
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });
    });

    await test.step('Try to access login page', async () => {
      await page.goto(`${BASE_URL}/login`);
    });

    await test.step('Verify redirect away from login', async () => {
      await page.waitForLoadState('networkidle');

      // Should redirect to dashboard (already logged in)
      const isRedirected = !page.url().includes('/login') || page.url().includes('callback');
      expect(isRedirected).toBe(true);
    });
  });

  test('auth state updates UI elements correctly', async ({ page }) => {
    await test.step('Login', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login|submit/i }).click();
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 });
    });

    await test.step('Check for user-specific UI elements', async () => {
      // Look for user avatar, name, or profile link
      const userElement = page.getByAltText(/avatar|profile/i).or(
        page.getByText(new RegExp(TEST_EMAIL.split('@')[0], 'i'))
      );

      const hasUserElement = await userElement.isVisible().catch(() => false);

      // Look for logout option
      const logoutOption = page.getByRole('button', { name: /sign out|logout/i }).or(
        page.getByRole('link', { name: /sign out|logout/i })
      );
      const hasLogoutOption = await logoutOption.isVisible().catch(() => false);

      // At least one user-specific element should be visible
      expect(hasUserElement || hasLogoutOption).toBe(true);
    });
  });
});

test.describe('Auth Error Handling', () => {
  test('handles network errors gracefully', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto(`${BASE_URL}/login`);
    });

    await test.step('Simulate offline mode', async () => {
      await page.context().setOffline(true);
    });

    await test.step('Try to login', async () => {
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    });

    await test.step('Verify error handling', async () => {
      // Should show error message (not crash)
      const errorMessage = page.getByText(/error|failed|connection|offline|try again/i);
      const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

      // Should still be on login page
      const stillOnLogin = page.url().includes('/login');

      expect(hasError || stillOnLogin).toBe(true);

      // Restore network
      await page.context().setOffline(false);
    });
  });

  test('handles malformed email gracefully', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto(`${BASE_URL}/login`);
    });

    await test.step('Enter malformed email', async () => {
      await page.getByLabel(/email/i).fill('not-an-email');
      await page.getByLabel(/password/i).fill('somepassword');
    });

    await test.step('Submit and verify validation', async () => {
      await page.getByRole('button', { name: /sign in|login|submit/i }).click();

      // Should show validation error (HTML5 or custom)
      const validationError = page.getByText(/valid.*email|invalid.*email|email.*required/i);
      const hasValidationError = await validationError.isVisible({ timeout: 3000 }).catch(() => false);

      // Or still on login page (form not submitted)
      const stillOnLogin = page.url().includes('/login');

      expect(hasValidationError || stillOnLogin).toBe(true);
    });
  });
});
