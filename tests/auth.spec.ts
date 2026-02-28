import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Ledgerly Authentication
 * Covers login, signup, and protected route redirects
 *
 * NOTE: These tests run in separate projects (chromium-auth, firefox-auth, etc.)
 * that do NOT have authentication state, to properly test login/signup pages.
 */

const TEST_LOCALE = 'en';
const BASE_URL = `http://localhost:3000/${TEST_LOCALE}`;

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
    });

    test('should display login form with all required fields', async ({ page }) => {
      // Check for email input
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
      await expect(submitButton).toBeVisible();
    });

    test('should show forgot password link', async ({ page }) => {
      const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
      await expect(forgotPasswordLink).toBeVisible();
      await expect(forgotPasswordLink).toHaveAttribute('href', `/${TEST_LOCALE}/forgot-password`);
    });

    test('should show link to signup page', async ({ page }) => {
      const signupLink = page.getByRole('link', { name: /sign up|create account/i });
      await expect(signupLink).toBeVisible();
      await expect(signupLink).toHaveAttribute('href', `/${TEST_LOCALE}/signup`);
    });

    test('should show validation error for empty form submission', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
      await submitButton.click();

      // HTML5 validation should prevent submission
      const emailInput = page.locator('#email');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
      expect(isInvalid).toBe(true);
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.locator('#email').fill('invalid-email');
      await page.locator('#password').fill('somepassword');

      const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
      await submitButton.click();

      // HTML5 email validation should prevent submission
      const emailInput = page.locator('#email');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
      expect(isInvalid).toBe(true);
    });

    test('should display brand name and features on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });

      // Check for brand name
      const brandName = page.getByText(/ledgerly/i);
      await expect(brandName.first()).toBeVisible();
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);
    });

    test('should display signup form with all required fields', async ({ page }) => {
      // Check for name input
      const nameInput = page.getByLabel(/name/i);
      await expect(nameInput).toBeVisible();

      // Check for email input
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.getByRole('button', { name: /create account|sign up|submit/i });
      await expect(submitButton).toBeVisible();
    });

    test('should show link to login page', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /sign in|login/i });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', `/${TEST_LOCALE}/login`);
    });

    test('should show validation error for empty form submission', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /create account|sign up|submit/i });
      await submitButton.click();

      // HTML5 validation should prevent submission
      const emailInput = page.locator('#email');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
      expect(isInvalid).toBe(true);
    });

    test('should show validation error for short password', async ({ page }) => {
      await page.locator('#name').fill('Test User');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('12345'); // Only 5 characters

      const submitButton = page.getByRole('button', { name: /create account|sign up|submit/i });
      await submitButton.click();

      // HTML5 minLength validation should prevent submission
      const passwordInput = page.locator('#password');
      const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
      expect(isInvalid).toBe(true);
    });

    test('should display benefits list on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });

      // Check for some benefits text (i18n: 'Free plan: Up to 5 customers')
      const freePlanBenefit = page.getByText(/free plan|5 customers|up to/i);
      const hasText = await freePlanBenefit.first().isVisible().catch(() => false);
      expect(hasText).toBe(true);
    });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from customers to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/customers`);

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from transactions to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/transactions`);

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from reports to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated user from settings to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Navigation', () => {
  test('should navigate from login to signup', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const signupLink = page.getByRole('link', { name: /sign up|create account/i });
    await signupLink.click();

    await expect(page).toHaveURL(/\/signup/);
  });

  test('should navigate from signup to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    const loginLink = page.getByRole('link', { name: /sign in|login/i });
    await loginLink.click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate from login to forgot password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    await forgotPasswordLink.click();

    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Responsive Design', () => {
  test('login page should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/login`);

    // Form should still be visible and usable
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();

    // Submit button should be visible
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
    await expect(submitButton).toBeVisible();
  });

  test('signup page should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/signup`);

    // Form should still be visible and usable
    const nameInput = page.getByLabel(/name/i);
    await expect(nameInput).toBeVisible();

    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
  });
});
