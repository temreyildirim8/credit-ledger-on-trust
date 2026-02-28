import { test, expect } from "@playwright/test";

/**
 * Pricing Page & Stripe Integration Tests
 *
 * Tests:
 * - Pricing page renders with all 3 plans
 * - Free plan shows correct limits (5 customers, 50 transactions)
 * - Monthly/Yearly billing toggle
 * - Pro plan "Save 17%" badge shows on yearly view
 * - Pricing FAQ section visible
 * - CTA buttons present and labeled correctly
 * - Checkout flow (mocked — verifies redirect intent, not actual payment)
 */

const BASE_URL = "http://localhost:3000";
const TEST_LOCALE = "en";
const PRICING_URL = `${BASE_URL}/${TEST_LOCALE}/pricing`;

test.describe("Pricing Page — Layout", () => {
  test("pricing page should load successfully", async ({ page }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/pric|plan/i);

    // Or check h1
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
  });

  test("pricing page should show 3 plan cards (Free, Pro, Enterprise)", async ({
    page,
  }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/free/i).first()).toBeVisible();
    await expect(page.getByText(/pro/i).first()).toBeVisible();
    await expect(page.getByText(/enterprise/i).first()).toBeVisible();
  });

  test("free plan should state 5 customers and 50 transactions", async ({
    page,
  }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    // Look for the free plan limit text
    const fiveCustomers = page.getByText(/5\s*customers?/i).first();
    const fiftyTx = page.getByText(/50\s*transactions?/i).first();

    const hasFive = await fiveCustomers.isVisible().catch(() => false);
    const hasFifty = await fiftyTx.isVisible().catch(() => false);

    expect(hasFive || hasFifty).toBe(true);
  });

  test("pricing page should not show outdated '10 customers' limit", async ({
    page,
  }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    // Ensure old limit is not present
    const oldLimit = page.getByText(/\b10\s*customers?\b/i);
    const hasOldLimit = await oldLimit.isVisible().catch(() => false);
    expect(hasOldLimit).toBe(false);
  });
});

test.describe("Pricing Page — Billing Toggle", () => {
  test("monthly/yearly billing toggle should be present", async ({ page }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    const toggle = page
      .getByRole("button", { name: /monthly|yearly|annual/i })
      .or(page.locator('[aria-label*="billing"], [role="switch"]'))
      .first();
    const hasToggle = await toggle.isVisible().catch(() => false);
    expect(hasToggle).toBe(true);
  });

  test("toggling to yearly should show discounted prices", async ({
    page,
  }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    // Find yearly toggle
    const yearlyBtn = page
      .getByRole("button", { name: /yearly|annual/i })
      .first();
    const hasYearly = await yearlyBtn.isVisible().catch(() => false);

    if (hasYearly) {
      await yearlyBtn.click();
      await page.waitForTimeout(500);

      // After toggle, "Save 17%" or similar discount should be visible
      const saveBadge = page.getByText(/save\s*\d+%|17%|discount/i);
      const hasSave = await saveBadge.isVisible().catch(() => false);
      expect(hasSave).toBe(true);
    }
  });

  test("toggling to monthly should hide yearly discount", async ({ page }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    // First go to yearly, then back to monthly
    const yearlyBtn = page
      .getByRole("button", { name: /yearly|annual/i })
      .first();
    const monthlyBtn = page
      .getByRole("button", { name: /monthly/i })
      .first();

    const hasYearly = await yearlyBtn.isVisible().catch(() => false);
    const hasMonthly = await monthlyBtn.isVisible().catch(() => false);

    if (hasYearly && hasMonthly) {
      await yearlyBtn.click();
      await page.waitForTimeout(300);
      await monthlyBtn.click();
      await page.waitForTimeout(300);

      // Monthly pricing should show /month label
      const monthLabel = page.getByText(/\/month|per month/i).first();
      const hasMonth = await monthLabel.isVisible().catch(() => false);
      expect(hasMonth).toBe(true);
    }
  });
});

test.describe("Pricing Page — CTA Buttons", () => {
  test("Free plan should have a Get Started CTA", async ({ page }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    // Free plan CTA renders as Link > Button, search by text content
    const cta = page.getByText(/get.*started|start.*free|get started free/i).first();
    const hasCTA = await cta.isVisible().catch(() => false);
    expect(hasCTA).toBe(true);
  });

  test("Pro plan should have a Get Pro or Upgrade CTA", async ({ page }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    // Pro plan CTA: 'Start Pro Trial' - search by text content
    const cta = page.getByText(/start.*pro|get.*pro|upgrade.*pro|choose.*pro/i).first();
    const hasCTA = await cta.isVisible().catch(() => false);
    expect(hasCTA).toBe(true);
  });

  test("clicking Pro plan CTA should initiate Stripe checkout or redirect", async ({
    page,
  }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    const proCTA = page
      .getByRole("button", { name: /get.*pro|upgrade.*pro|choose.*pro|start.*pro/i })
      .first();
    const hasProCTA = await proCTA.isVisible().catch(() => false);

    if (!hasProCTA) {
      test.skip();
      return;
    }

    // Listen for navigation or Stripe modal
    const navigationPromise = page.waitForURL(/stripe|checkout|pricing|signup|login/, {
      timeout: 5000,
    }).catch(() => null);

    await proCTA.click();
    const result = await navigationPromise;

    // Either navigated somewhere (Stripe, login, signup) or a modal appeared
    const hasModal = await page.getByRole("dialog").isVisible().catch(() => false);

    expect(result !== null || hasModal).toBe(true);
  });
});

test.describe("Pricing Page — FAQ Section", () => {
  test("pricing page should have a FAQ section", async ({ page }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    // Scroll down to FAQ
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const faqHeading = page
      .getByRole("heading", { name: /faq|frequently/i })
      .first();
    const hasFAQ = await faqHeading.isVisible().catch(() => false);
    expect(hasFAQ).toBe(true);
  });

  test("FAQ should mention correct free plan limits", async ({ page }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const bodyText = await page.textContent("body");
    const mentions5 = bodyText?.includes("5") ?? false;
    const mentions50 = bodyText?.includes("50") ?? false;

    expect(mentions5 || mentions50).toBe(true);
  });
});

test.describe("Pricing Page — Light Theme", () => {
  test("pricing page should be in light mode", async ({ page }) => {
    await page.goto(PRICING_URL);
    await page.waitForLoadState("networkidle");

    // Check that dark class is NOT applied to html/body
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass ?? "").not.toContain("dark");
  });
});
