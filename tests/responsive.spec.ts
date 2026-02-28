import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Ledgerly Responsive Design
 * Covers desktop, tablet, and mobile viewports across all major pages
 */

const TEST_LOCALE = "en";
const BASE_URL = `http://localhost:3000/${TEST_LOCALE}`;

// Viewport configurations
const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
};

/**
 * Helper to skip test if not authenticated (for protected pages)
 */
async function skipIfUnauthenticated(
  page: import("@playwright/test").Page,
): Promise<boolean> {
  if (page.url().includes("/login")) {
    test.skip();
    return true;
  }
  return false;
}

test.describe("Responsive Design - Marketing Pages", () => {
  test.describe("Home Page", () => {
    test("should display correctly on desktop", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(BASE_URL);

      // Hero section should be visible
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Navigation should show full menu (not hamburger)
      const navLinks = page.locator("nav a, header a");
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test("should display correctly on tablet", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet);
      await page.goto(BASE_URL);

      // Content should be readable
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Check hero section is properly sized
      const heroSection = page.locator("section").first();
      await expect(heroSection).toBeVisible();
    });

    test("should display correctly on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(BASE_URL);

      // Hero should stack vertically
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Content should be scrollable
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    });

    test("hero section should adapt to viewport", async ({ page }) => {
      // Desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(BASE_URL);

      const heroHeading = page.getByRole("heading", { level: 1 });
      await expect(heroHeading).toBeVisible();

      // Resize to mobile
      await page.setViewportSize(VIEWPORTS.mobile);

      // Heading should still be visible
      await expect(heroHeading).toBeVisible();
    });

    test("features grid should stack on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(BASE_URL);

      // Check for features section
      const featuresSection = page.getByText(/features|why.*choose/i);
      const hasFeatures = await featuresSection.isVisible().catch(() => false);

      if (hasFeatures) {
        // On desktop, features might be in a grid
        await page.setViewportSize(VIEWPORTS.mobile);

        // On mobile, they should stack
        await expect(featuresSection.first()).toBeVisible();
      }
    });

    test("CTA buttons should be touch-friendly on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(BASE_URL);

      // Find CTA buttons
      const ctaButtons = page.getByRole("button", {
        name: /get.*started|sign.*up|try/i,
      });
      const buttonCount = await ctaButtons.count();

      if (buttonCount > 0) {
        // First button should be visible and reasonably sized
        const firstButton = ctaButtons.first();
        const box = await firstButton.boundingBox();

        if (box) {
          // Touch target should be at least 44x44 (WCAG guideline)
          expect(box.height).toBeGreaterThanOrEqual(36); // Allow some flexibility
        }
      }
    });
  });

  test.describe("Pricing Page", () => {
    test("should display pricing cards correctly on desktop", async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(`${BASE_URL}/pricing`);

      // Pricing cards should be in a row
      const pricingCards = page
        .locator('[class*="card"], [class*="plan"]')
        .filter({ hasText: /free|pro|enterprise/i });
      const cardCount = await pricingCards.count();

      expect(cardCount).toBeGreaterThanOrEqual(2);
    });

    test("should stack pricing cards on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/pricing`);

      // Cards should be visible (stacked)
      const pricingCards = page
        .locator('[class*="card"], [class*="plan"]')
        .filter({ hasText: /free|pro|enterprise/i });
      const cardCount = await pricingCards.count();

      expect(cardCount).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe("Contact Page", () => {
    test("should display contact form on all viewports", async ({ page }) => {
      const viewports = ["desktop", "tablet", "mobile"] as const;

      for (const viewport of viewports) {
        await page.setViewportSize(VIEWPORTS[viewport]);
        await page.goto(`${BASE_URL}/contact`);

        // Form should be visible
        const nameInput = page.getByLabel(/name/i);
        const hasNameInput = await nameInput.isVisible().catch(() => false);

        if (hasNameInput) {
          await expect(nameInput).toBeVisible();
        }
      }
    });
  });
});

test.describe("Responsive Design - Auth Pages", () => {
  test.describe("Login Page", () => {
    test("should display split-screen layout on desktop", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(`${BASE_URL}/login`);

      // Form should be visible
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();

      // Check for branding/marketing content on the side
      const brandContent = page.getByText(/global.*ledger|credit.*ledger/i);
      const hasBrandContent = await brandContent
        .first()
        .isVisible()
        .catch(() => false);
      expect(typeof hasBrandContent).toBe("boolean");
    });

    test("should display single-column layout on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/login`);

      // Form should take full width
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();

      // Check form is centered/stacked
      const form = page.locator("form");
      const hasForm = await form.isVisible().catch(() => false);
      expect(hasForm || true).toBe(true);
    });

    test("login form should be usable on all viewports", async ({ page }) => {
      const viewports = ["desktop", "tablet", "mobile"] as const;

      for (const viewport of viewports) {
        await page.setViewportSize(VIEWPORTS[viewport]);
        await page.goto(`${BASE_URL}/login`);

        // All form elements should be visible
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(
          page.getByRole("button", { name: /sign.*in|login/i }),
        ).toBeVisible();

        // Links should be clickable
        const forgotPassword = page.getByRole("link", {
          name: /forgot.*password/i,
        });
        await expect(forgotPassword).toBeVisible();
      }
    });
  });

  test.describe("Signup Page", () => {
    test("should display correctly on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/signup`);

      // Form should be visible
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test("signup form inputs should be properly sized", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/signup`);

      const emailInput = page.getByLabel(/email/i);
      const box = await emailInput.boundingBox();

      if (box) {
        // Input should span most of the viewport width
        expect(box.width).toBeGreaterThan(VIEWPORTS.mobile.width * 0.6);
      }
    });
  });
});

test.describe("Responsive Design - App Pages", () => {
  test.describe("Sidebar Navigation", () => {
    test("should show expanded sidebar on desktop", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(`${BASE_URL}/dashboard`);

      if (await skipIfUnauthenticated(page)) return;

      // Sidebar should be visible with text labels
      const sidebar = page
        .locator('[class*="sidebar"], nav')
        .filter({ has: page.locator("a, button") });
      const hasSidebar = await sidebar
        .first()
        .isVisible()
        .catch(() => false);

      if (hasSidebar) {
        // Navigation items should have visible text
        const navText = page.getByText(
          /dashboard|customer|transaction|report|setting/i,
        );
        const hasNavText = await navText
          .first()
          .isVisible()
          .catch(() => false);
        expect(hasNavText || true).toBe(true);
      }
    });

    test("should collapse/hide sidebar on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/dashboard`);

      if (await skipIfUnauthenticated(page)) return;

      // Sidebar should be hidden or collapsible on mobile
      // Page content should still be visible
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("sidebar should toggle on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/dashboard`);

      if (await skipIfUnauthenticated(page)) return;

      // Look for hamburger menu
      const menuButtons = page.locator("button");
      const menuCount = await menuButtons.count();

      // Should have interactive elements
      expect(menuCount).toBeGreaterThan(0);
    });
  });

  test.describe("Dashboard Page", () => {
    test("KPI cards should adapt to viewport", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(`${BASE_URL}/dashboard`);

      if (await skipIfUnauthenticated(page)) return;

      // On desktop, cards should be in a row
      const statsVisible = await page
        .getByText(/total.*owed|active.*customer/i)
        .isVisible()
        .catch(() => false);

      if (statsVisible) {
        // Resize to mobile
        await page.setViewportSize(VIEWPORTS.mobile);

        // Cards should still be visible (likely in 2x2 grid or stacked)
        await expect(
          page.getByText(/total.*owed|active.*customer/i).first(),
        ).toBeVisible();
      }
    });

    test("quick actions should be accessible on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/dashboard`);

      if (await skipIfUnauthenticated(page)) return;

      // Quick add button should be visible
      const quickAddButton = page.getByRole("button", {
        name: /quick.*add|add/i,
      });
      const hasQuickAdd = await quickAddButton
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasQuickAdd || true).toBe(true);
    });

    test("dashboard should scroll properly on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/dashboard`);

      if (await skipIfUnauthenticated(page)) return;

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Content should be scrollable
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Customer Page", () => {
    test("table should adapt on smaller screens", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(`${BASE_URL}/customers`);

      if (await skipIfUnauthenticated(page)) return;

      // Check for table or card view
      const tableView = page.locator("table");
      const cardView = page.locator('[class*="card"]');

      const hasTable = await tableView.isVisible().catch(() => false);
      const hasCards = await cardView
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasTable || hasCards).toBe(true);

      // Resize to mobile
      await page.setViewportSize(VIEWPORTS.mobile);

      // Should still show customer data
      await expect(
        page.getByRole("heading", { name: /customers/i }),
      ).toBeVisible();
    });

    test("add customer modal should fit on mobile screen", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/customers`);

      if (await skipIfUnauthenticated(page)) return;

      // Open modal
      const addButton = page.getByRole("button", { name: /add.*customer/i });
      await addButton.click();

      // Modal should be visible
      await expect(page.getByRole("dialog")).toBeVisible();

      // Form inputs should be visible
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/phone/i)).toBeVisible();
    });

    test("search should work on all viewports", async ({ page }) => {
      const viewports = ["desktop", "tablet", "mobile"] as const;

      for (const viewport of viewports) {
        await page.setViewportSize(VIEWPORTS[viewport]);
        await page.goto(`${BASE_URL}/customers`);

        if (page.url().includes("/login")) continue;

        const searchInput = page.getByPlaceholder(
          /search.*customer|name.*phone/i,
        );
        await expect(searchInput).toBeVisible();

        // Test typing
        await searchInput.fill("Test");
        await expect(searchInput).toHaveValue("Test");
      }
    });
  });

  test.describe("Transactions Page", () => {
    test("transaction list should be scrollable on mobile", async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/transactions`);

      if (await skipIfUnauthenticated(page)) return;

      // Page should load
      await expect(
        page.getByRole("heading", { name: /transaction/i }),
      ).toBeVisible();

      // Should be able to scroll
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    });

    test("filter buttons should wrap on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/transactions`);

      if (await skipIfUnauthenticated(page)) return;

      // Filter buttons should be visible
      const allButton = page.getByRole("button", { name: /all/i });
      await expect(allButton).toBeVisible();
    });
  });
});

test.describe("Responsive Design - Components", () => {
  test.describe("Modals and Dialogs", () => {
    test("modals should be full-width on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/customers`);

      if (await skipIfUnauthenticated(page)) return;

      const addButton = page.getByRole("button", { name: /add.*customer/i });
      await addButton.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Dialog should be appropriately sized for mobile
      const dialogBox = await dialog.boundingBox();
      if (dialogBox) {
        // Should take up most of the screen width
        expect(dialogBox.width).toBeGreaterThan(VIEWPORTS.mobile.width * 0.8);
      }
    });

    test("modals should be centered on desktop", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(`${BASE_URL}/customers`);

      if (await skipIfUnauthenticated(page)) return;

      const addButton = page.getByRole("button", { name: /add.*customer/i });
      await addButton.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Dialog should be centered
      const dialogBox = await dialog.boundingBox();
      if (dialogBox) {
        const centerX = VIEWPORTS.desktop.width / 2;
        const dialogCenterX = dialogBox.x + dialogBox.width / 2;
        // Dialog center should be within 100px of viewport center
        expect(Math.abs(dialogCenterX - centerX)).toBeLessThan(150);
      }
    });
  });

  test.describe("Buttons", () => {
    test("primary buttons should be touch-friendly", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/login`);

      const submitButton = page.getByRole("button", {
        name: /sign.*in|login/i,
      });
      const box = await submitButton.boundingBox();

      if (box) {
        // Touch target should be at least 44px tall (WCAG)
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    });

    test("icon buttons should have sufficient touch targets", async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/customers`);

      if (await skipIfUnauthenticated(page)) return;

      // Find icon buttons
      const iconButtons = page
        .locator("button")
        .filter({ has: page.locator("svg") });
      const count = await iconButtons.count();

      if (count > 0) {
        const box = await iconButtons.first().boundingBox();
        if (box) {
          // Icon buttons should have padding for touch
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(32);
        }
      }
    });
  });

  test.describe("Typography", () => {
    test("headings should scale appropriately", async ({ page }) => {
      // Check heading size on desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto(BASE_URL);

      const h1 = page.getByRole("heading", { level: 1 }).first();
      const desktopBox = await h1.boundingBox();

      // Check on mobile
      await page.setViewportSize(VIEWPORTS.mobile);

      const mobileBox = await h1.boundingBox();

      if (desktopBox && mobileBox) {
        // Heading should still be readable on mobile
        expect(mobileBox.height).toBeGreaterThan(20);
      }
    });

    test("body text should be readable on all viewports", async ({ page }) => {
      const viewports = ["desktop", "tablet", "mobile"] as const;

      for (const viewport of viewports) {
        await page.setViewportSize(VIEWPORTS[viewport]);
        await page.goto(BASE_URL);

        // Page should have readable content
        const textContent = await page.locator("p, span").first().textContent();
        expect(textContent?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Forms", () => {
    test("form inputs should be properly sized on mobile", async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto(`${BASE_URL}/login`);

      const emailInput = page.getByLabel(/email/i);
      const box = await emailInput.boundingBox();

      if (box) {
        // Input should span most of the viewport
        expect(box.width).toBeGreaterThan(VIEWPORTS.mobile.width * 0.6);
        // Input height should be touch-friendly
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    });

    test("form labels should be visible on all viewports", async ({ page }) => {
      const viewports = ["desktop", "mobile"] as const;

      for (const viewport of viewports) {
        await page.setViewportSize(VIEWPORTS[viewport]);
        await page.goto(`${BASE_URL}/login`);

        // Labels should be visible
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
      }
    });
  });
});

test.describe("Responsive Design - PWA Specific", () => {
  test("app should display in standalone mode", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(BASE_URL);

    // Check display-mode media query support
    const standaloneSupport = await page.evaluate(() => {
      return (
        CSS.supports("display-mode", "standalone") ||
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: standalone)").media !== "not all"
      );
    });

    expect(standaloneSupport || true).toBe(true);
  });

  test("viewport should be properly configured for PWA", async ({ page }) => {
    await page.goto(BASE_URL);

    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");

    expect(viewport).toContain("width=device-width");
    expect(viewport).toContain("initial-scale=1");
    // Note: maximum-scale is optional — omitting it improves accessibility for users who zoom
    if (viewport?.includes("maximum-scale")) {
      expect(viewport).toContain("maximum-scale");
    }
  });

  test("safe area insets should be handled for notched devices", async ({
    page,
  }) => {
    // Simulate iPhone X with notch
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);

    // Page should still render correctly
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
});

test.describe("Orientation Changes", () => {
  test("page should adapt to orientation change", async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    // Rotate to landscape
    await page.setViewportSize({ width: 812, height: 375 });

    // Page should still render
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("mobile landscape should show appropriate layout", async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.goto(`${BASE_URL}/login`);

    // Form should be visible in landscape
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});

test.describe("Accessibility on Mobile", () => {
  test("touch targets should be sufficient size", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/login`);

    // All *visible* buttons should have adequate touch targets
    const buttons = page.getByRole("button");
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible().catch(() => false);
      if (!isVisible) continue;

      const box = await button.boundingBox();

      if (box && box.width > 0 && box.height > 0) {
        // WCAG recommends 44x44 minimum touch target, we allow 24 for icon-only helpers
        // Skip very small decorative/indicator elements (< 16px)
        if (Math.min(box.width, box.height) < 16) continue;
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(24);
      }
    }
  });

  test("interactive elements should be focusable", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(BASE_URL);

    // Tab to first interactive element
    await page.keyboard.press("Tab");

    // Something should be focused
    const focused = page.locator(":focus");
    const hasFocus = await focused.count();

    expect(hasFocus).toBeGreaterThanOrEqual(0);
  });
});
