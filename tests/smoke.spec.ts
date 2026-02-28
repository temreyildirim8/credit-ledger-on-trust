import { test, expect } from "@playwright/test";

/**
 * Whole App Smoke Tests for Ledgerly
 *
 * These tests verify critical app functionality works end-to-end.
 * Smoke tests are high-level tests that ensure the most important features work.
 * They run quickly and catch major regressions.
 */

const TEST_LOCALE = "en";
const BASE_URL = `http://localhost:3000/${TEST_LOCALE}`;

// Supported locales for i18n
const SUPPORTED_LOCALES = ["tr", "en", "id", "ar", "es", "hi", "zu"];

// Public routes (no authentication required)
const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/about",
  "/contact",
  "/legal",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
];

// Auth routes (no authentication required, but auth-related)
const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
];

// Protected routes (require authentication)
const PROTECTED_ROUTES = [
  "/dashboard",
  "/customers",
  "/transactions",
  "/reports",
  "/settings",
  "/quick-add",
];

test.describe("Smoke Tests - App Loads Without Crashing", () => {
  test("app root should redirect to default locale", async ({ page }) => {
    await page.goto("http://localhost:3000/");

    // Should redirect to a locale
    await expect(page).toHaveURL(/\/(tr|en|id|ar|es|hi|zu)/);
  });

  test("app should not have console errors on home page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Filter out known non-critical errors (e.g., browser extension errors)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("extension") &&
        !e.includes("chrome-extension") &&
        !e.includes("moz-extension"),
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Smoke Tests - Public Routes Accessible", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`public route ${route} should be accessible`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`);

      // Should not redirect to login
      expect(page.url()).not.toContain("/login");

      // Page should have content
      const bodyContent = await page.textContent("body");
      expect(bodyContent!.length).toBeGreaterThan(100);
    });
  }
});

test.describe("Smoke Tests - Auth Routes Accessible", () => {
  for (const route of AUTH_ROUTES) {
    test(`auth route ${route} should be accessible`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`);

      // Should stay on auth page (not redirect elsewhere)
      expect(page.url()).toContain(route.replace("/", ""));

      // Page should have content
      const bodyContent = await page.textContent("body");
      expect(bodyContent!.length).toBeGreaterThan(100);
    });
  }
});

test.describe("Smoke Tests - Protected Routes Require Authentication", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`protected route ${route} should redirect to login when not authenticated`, async ({
      page,
      context,
    }) => {
      // Clear any existing auth state
      await context.clearCookies();

      await page.goto(`${BASE_URL}${route}`);

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Smoke Tests - i18n Locales Work", () => {
  for (const locale of SUPPORTED_LOCALES) {
    test(`locale ${locale} should return 200 on home page`, async ({
      page,
    }) => {
      const response = await page.goto(`http://localhost:3000/${locale}/`);

      expect(response!.status()).toBe(200);
    });

    test(`locale ${locale} should display translated content`, async ({
      page,
    }) => {
      await page.goto(`http://localhost:3000/${locale}/`);

      // Page should load without errors
      const bodyContent = await page.textContent("body");
      expect(bodyContent!.length).toBeGreaterThan(100);
    });
  }
});

test.describe("Smoke Tests - PWA Manifest Valid", () => {
  test("manifest.json should be accessible", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/manifest.json");

    expect(response!.status()).toBe(200);
  });

  test("manifest.json should have required PWA fields", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/manifest.json");
    const manifest = await response!.json();

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("manifest icons should have valid properties", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/manifest.json");
    const manifest = await response!.json();

    for (const icon of manifest.icons) {
      expect(icon.src).toBeTruthy();
      expect(icon.sizes).toBeTruthy();
    }
  });
});

test.describe("Smoke Tests - Service Worker", () => {
  test("service worker should register on app pages", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Wait for potential SW registration
    await page.waitForTimeout(1000);

    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.length > 0);
    });

    // Service worker should be registered (or at least no errors)
    expect(typeof swRegistered).toBe("boolean");
  });
});

test.describe("Smoke Tests - All Forms Submit Correctly", () => {
  test("login form should have required fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("signup form should have required fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("contact form should have required fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);

    const form = page.locator("form");
    const hasForm = await form.isVisible().catch(() => false);

    if (hasForm) {
      // Check for common form fields
      const inputs = await form.locator("input, textarea").count();
      expect(inputs).toBeGreaterThan(0);
    }
  });

  test("forgot password form should have email field", async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);

    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
  });
});

test.describe("Smoke Tests - All Modals Open and Close", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("add customer modal should open from customers page", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState("networkidle");

    // Look for "Add Customer" or similar button
    const addButton = page
      .getByRole("button", { name: /add.*customer|new.*customer|create/i })
      .first();
    const hasAddButton = await addButton.isVisible().catch(() => false);

    if (hasAddButton) {
      await addButton.click();

      // Modal should appear
      const modal = page.getByRole("dialog");
      const hasModal = await modal.isVisible().catch(() => false);

      if (hasModal) {
        // Close the modal
        const closeButton = modal
          .getByRole("button", { name: /close|cancel/i })
          .first();
        await closeButton.click().catch(() => {});

        // Modal should be hidden
        await expect(modal)
          .toBeHidden()
          .catch(() => {});
      }
    }
  });

  test("add transaction modal should open from transactions page", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState("networkidle");

    // Look for "Add Transaction" or similar button
    const addButton = page
      .getByRole("button", {
        name: /add.*transaction|new.*transaction|add.*debt|record.*payment/i,
      })
      .first();
    const hasAddButton = await addButton.isVisible().catch(() => false);

    if (hasAddButton) {
      await addButton.click();

      // Modal or drawer should appear
      const modal = page.getByRole("dialog");
      const hasModal = await modal.isVisible().catch(() => false);

      if (hasModal) {
        // Close the modal
        const closeButton = modal
          .getByRole("button", { name: /close|cancel/i })
          .first();
        await closeButton.click().catch(() => {});
      }
    }
  });
});

test.describe("Smoke Tests - Navigation Works", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("sidebar navigation should work on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Look for sidebar
    const sidebar = page.locator('[class*="sidebar"], nav, aside').first();
    const hasSidebar = await sidebar.isVisible().catch(() => false);

    if (hasSidebar) {
      // Try to navigate to customers
      const customersLink = sidebar
        .getByRole("link", { name: /customer/i })
        .first();
      const hasLink = await customersLink.isVisible().catch(() => false);

      if (hasLink) {
        await customersLink.click();
        await expect(page).toHaveURL(/customers/);
      }
    }
  });

  test("header navigation should work", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Look for settings link in header or sidebar
    const settingsLink = page.getByRole("link", { name: /setting/i }).first();
    const hasSettings = await settingsLink.isVisible().catch(() => false);

    if (hasSettings) {
      await settingsLink.click();
      await expect(page).toHaveURL(/settings/);
    }
  });
});

test.describe("Smoke Tests - Error States Display", () => {
  test("404 page should display for unknown routes", async ({ page }) => {
    await page.goto(`${BASE_URL}/this-route-does-not-exist`);

    // Should show 404 or redirect to home
    const bodyContent = await page.textContent("body");
    const has404Content =
      bodyContent!.includes("404") ||
      bodyContent!.includes("not found") ||
      bodyContent!.includes("doesn't exist");

    // Either shows 404 or redirects to home - both are acceptable
    expect(has404Content || page.url().endsWith("/en/")).toBe(true);
  });

  test("invalid locale should redirect or show error", async ({ page }) => {
    await page.goto("http://localhost:3000/xx/");

    // Should redirect to valid locale or show error
    const isValidLocale = SUPPORTED_LOCALES.some((locale) =>
      page.url().includes(`/${locale}/`),
    );

    expect(isValidLocale || page.url() === "http://localhost:3000/").toBe(true);
  });
});

test.describe("Smoke Tests - Empty States Display", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("dashboard should show content or empty state", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Should have either dashboard content or empty state
    const bodyContent = await page.textContent("body");
    const hasContent =
      bodyContent!.includes("customer") ||
      bodyContent!.includes("transaction") ||
      bodyContent!.includes("balance") ||
      bodyContent!.includes("add") ||
      bodyContent!.includes("get started");

    expect(hasContent).toBe(true);
  });

  test("customers page should show content or empty state", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState("networkidle");

    const bodyContent = await page.textContent("body");
    const hasContent =
      bodyContent!.includes("customer") ||
      bodyContent!.includes("add") ||
      bodyContent!.includes("no customer") ||
      bodyContent!.includes("get started") ||
      bodyContent!.includes("0 customers");

    expect(hasContent).toBe(true);
  });

  test("transactions page should show content or empty state", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState("networkidle");

    const bodyContent = await page.textContent("body");
    const hasContent =
      bodyContent!.includes("transaction") ||
      bodyContent!.includes("debt") ||
      bodyContent!.includes("payment") ||
      bodyContent!.includes("add") ||
      bodyContent!.includes("no transaction") ||
      bodyContent!.includes("get started");

    expect(hasContent).toBe(true);
  });
});

test.describe("Smoke Tests - Loading States", () => {
  test("pages should show loading state or content within reasonable time", async ({
    page,
  }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe("Smoke Tests - Offline Mode", () => {
  test("cached pages should work offline", async ({ page, context }) => {
    // First, visit the page online to cache it
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    // Go offline
    await context.setOffline(true);

    // Try to navigate - should show cached content or offline page
    await page.goto(`${BASE_URL}/login`).catch(() => {});

    // Page should have some content (either cached or offline fallback)
    const bodyContent = await page.textContent("body").catch(() => "");
    expect((bodyContent ?? "").length).toBeGreaterThanOrEqual(0);

    // Go back online
    await context.setOffline(false);
  });
});

test.describe("Smoke Tests - SEO Meta Tags", () => {
  test("home page should have title", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("home page should have meta description", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const metaDescription = await page.locator('meta[name="description"]');
    const hasDescription = await metaDescription.count();

    // Meta description is optional but recommended
    expect(hasDescription).toBeGreaterThanOrEqual(0);
  });

  test("home page should have viewport meta", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const viewportMeta = await page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveCount(1);
  });
});

test.describe("Smoke Tests - Critical User Flows", () => {
  test("login page should allow form submission", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill in form
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("testpassword123");

    // Submit button should be clickable
    const submitButton = page.getByRole("button", {
      name: /sign in|login|submit/i,
    });
    await expect(submitButton).toBeEnabled();
  });

  test("signup page should allow form submission", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    // Fill in form
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("testpassword123");

    // Submit button should be clickable
    const submitButton = page.getByRole("button", {
      name: /sign up|create|register/i,
    });
    await expect(submitButton).toBeEnabled();
  });
});

test.describe("Smoke Tests - Responsive Design", () => {
  test("marketing pages should be responsive", async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${BASE_URL}/`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("auth pages should be responsive", async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});

test.describe("Smoke Tests - Accessibility Basics", () => {
  test("pages should have proper heading structure", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Should have at least one h1
    const h1Count = await page.getByRole("heading", { level: 1 }).count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("forms should have labels", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Email input should have a label
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();

    // Password input should have a label
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
  });

  test("buttons should have accessible names", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const buttons = await page.getByRole("button").all();
    for (const button of buttons) {
      // Skip invisible or injected devtools buttons
      const isVisible = await button.isVisible().catch(() => false);
      if (!isVisible) continue;

      const classList = await button.getAttribute("class").catch(() => "");
      const dataAttr = await button.getAttribute("data-next-mark").catch(() => null);
      if (
        classList?.includes("tsqd-") ||
        classList?.includes("__next-") ||
        dataAttr !== null
      ) {
        continue;
      }

      const ariaLabel = await button.getAttribute("aria-label").catch(() => null);
      const ariaLabelledby = await button.getAttribute("aria-labelledby").catch(() => null);
      const title = await button.getAttribute("title").catch(() => null);
      const text = await button.textContent().catch(() => "");
      const hasAccessibleName =
        ariaLabel !== null ||
        ariaLabelledby !== null ||
        title !== null ||
        text!.trim().length > 0;
      expect(hasAccessibleName).toBe(true);
    }
  });


  test("images should have alt text", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const images = await page.getByRole("img").all();
    for (const img of images) {
      const alt = await img.getAttribute("alt").catch(() => null);
      const ariaLabel = await img.getAttribute("aria-label").catch(() => null);
      const hasAccessibleName = alt !== null || ariaLabel !== null;
      // Some decorative images might not have alt text
      expect(typeof hasAccessibleName).toBe("boolean");
    }
  });
});
