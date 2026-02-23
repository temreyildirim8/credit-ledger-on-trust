import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Global Ledger Onboarding Flow
 * Tests the 4-step onboarding wizard: Currency -> Language -> Category -> Success
 */

const TEST_LOCALE = 'en';
const BASE_URL = `http://localhost:3000/${TEST_LOCALE}`;

test.describe('Onboarding Flow', () => {
  // Note: These tests require authentication. In a real test environment,
  // you would either mock authentication or use a test user.

  test.describe('Onboarding Page Structure', () => {
    test('should show progress indicator', async ({ page }) => {
      // Navigate to onboarding (will redirect if not authenticated)
      await page.goto(`${BASE_URL}/onboarding`);

      // If redirected to login, skip the rest of this test
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }

      // Check for step progress text
      const stepText = page.getByText(/step.*\d.*\d/i);
      await expect(stepText).toBeVisible();

      // Check for progress bar
      const progressBar = page.locator('[role="progressbar"]');
      await expect(progressBar).toBeVisible();
    });

    test('should display navigation buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`);

      // If redirected to login, skip
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }

      // Check for Back button (should be disabled on first step)
      const backButton = page.getByRole('button', { name: /back/i });
      await expect(backButton).toBeVisible();
      await expect(backButton).toBeDisabled();

      // Check for Next button
      const nextButton = page.getByRole('button', { name: /next/i });
      await expect(nextButton).toBeVisible();
    });
  });

  test.describe('Currency Selection Step', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`);
      // Skip if redirected to login
      if (page.url().includes('/login')) {
        test.skip();
      }
    });

    test('should display currency options', async ({ page }) => {
      // Check for currency title
      await expect(page.getByRole('heading', { name: /currency|select.*currency/i })).toBeVisible();

      // Check for common currencies
      await expect(page.getByText('TRY')).toBeVisible();
      await expect(page.getByText('IDR')).toBeVisible();
      await expect(page.getByText('NGN')).toBeVisible();
      await expect(page.getByText('USD')).toBeVisible();
      await expect(page.getByText('EUR')).toBeVisible();
    });

    test('should display currency symbols and flags', async ({ page }) => {
      // Check for Turkish Lira symbol and flag
      await expect(page.getByText('₺')).toBeVisible();

      // Check for currency grid
      const currencyButtons = page.locator('button[type="button"]').filter({ hasText: /^[A-Z]{3}$/ });
      const count = await currencyButtons.count();
      expect(count).toBeGreaterThan(4);
    });

    test('should select currency on click', async ({ page }) => {
      // Click on USD currency
      const usdButton = page.locator('button').filter({ hasText: /USD/ }).first();
      await usdButton.click();

      // Button should show selected state (check for primary border class)
      await expect(usdButton).toHaveClass(/border-primary/);

      // Next button should now be enabled
      const nextButton = page.getByRole('button', { name: /next/i });
      await expect(nextButton).toBeEnabled();
    });
  });

  test.describe('Language Selection Step', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`);
      // Skip if redirected to login
      if (page.url().includes('/login')) {
        test.skip();
      }
    });

    test('should display language options', async ({ page }) => {
      // Check for language title
      await expect(page.getByRole('heading', { name: /language|select.*language/i })).toBeVisible();

      // Check for common languages
      await expect(page.getByText('English')).toBeVisible();
      await expect(page.getByText('Turkish')).toBeVisible();
      await expect(page.getByText('Spanish')).toBeVisible();
      await expect(page.getByText('Indonesian')).toBeVisible();
    });

    test('should display native language names', async ({ page }) => {
      await expect(page.getByText('Türkçe')).toBeVisible();
      await expect(page.getByText('Español')).toBeVisible();
    });

    test('should select language on click', async ({ page }) => {
      // Click on English language
      const englishButton = page.locator('button').filter({ hasText: /English/ }).first();
      await englishButton.click();

      // Button should show selected state
      await expect(englishButton).toHaveClass(/border-primary/);
    });
  });

  test.describe('Category Selection Step', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`);
      // Skip if redirected to login
      if (page.url().includes('/login')) {
        test.skip();
      }
    });

    test('should display business category options', async ({ page }) => {
      // Check for category title
      await expect(page.getByRole('heading', { name: /category|business|type/i })).toBeVisible();

      // Check for category icons and names
      await expect(page.getByText(/bakkal|kirana|warung|spaza|kiosk/i)).toBeVisible();
      await expect(page.getByText(/restaurant/i)).toBeVisible();
      await expect(page.getByText(/retail/i)).toBeVisible();
    });

    test('should select category on click', async ({ page }) => {
      // Click on Retail category
      const retailButton = page.locator('button').filter({ hasText: /retail/i }).first();
      await retailButton.click();

      // Button should show selected state
      await expect(retailButton).toHaveClass(/border-primary/);
    });
  });

  test.describe('Navigation Flow', () => {
    test('should enable next button only when selection is made', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`);
      // Skip if redirected to login
      if (page.url().includes('/login')) {
        test.skip();
      }

      const nextButton = page.getByRole('button', { name: /next/i });

      // Initially disabled (no selection)
      await expect(nextButton).toBeDisabled();

      // Make a selection
      const tryButton = page.locator('button').filter({ hasText: /TRY/ }).first();
      await tryButton.click();

      // Now enabled
      await expect(nextButton).toBeEnabled();
    });

    test('should navigate to next step when next button is clicked', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`);
      // Skip if redirected to login
      if (page.url().includes('/login')) {
        test.skip();
      }

      // Select currency
      const tryButton = page.locator('button').filter({ hasText: /TRY/ }).first();
      await tryButton.click();

      // Click next
      await page.getByRole('button', { name: /next/i }).click();

      // Should now be on language step
      await expect(page.getByRole('heading', { name: /language|select.*language/i })).toBeVisible();

      // Back button should be enabled
      const backButton = page.getByRole('button', { name: /back/i });
      await expect(backButton).toBeEnabled();
    });

    test('should navigate back to previous step', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding`);
      // Skip if redirected to login
      if (page.url().includes('/login')) {
        test.skip();
      }

      // Select currency and go to next step
      const tryButton = page.locator('button').filter({ hasText: /TRY/ }).first();
      await tryButton.click();
      await page.getByRole('button', { name: /next/i }).click();

      // Should be on language step
      await expect(page.getByRole('heading', { name: /language/i })).toBeVisible();

      // Go back
      await page.getByRole('button', { name: /back/i }).click();

      // Should be back on currency step
      await expect(page.getByRole('heading', { name: /currency/i })).toBeVisible();
    });
  });
});

test.describe('Onboarding Responsive Design', () => {
  test('should display properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/onboarding`);

    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip();
    }

    // Progress should be visible
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // Navigation buttons should be visible
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
  });

  test('should display currency grid on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/onboarding`);

    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip();
    }

    // Should show at least some currencies
    await expect(page.getByText('TRY')).toBeVisible();
    await expect(page.getByText('USD')).toBeVisible();
  });
});
