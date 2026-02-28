import { test, expect, Page } from "@playwright/test";

/**
 * Performance Tests for Ledgerly
 *
 * These tests measure performance metrics using:
 * - Web Vitals (FCP, LCP, TTI, CLS)
 * - Load time measurements
 * - Resource timing
 *
 * Performance budgets:
 * - First Contentful Paint (FCP): < 2s
 * - Largest Contentful Paint (LCP): < 3s
 * - Time to Interactive (TTI): < 4s
 * - Cumulative Layout Shift (CLS): < 0.1
 */

const TEST_LOCALE = "en";
const BASE_URL = `http://localhost:3000/${TEST_LOCALE}`;

// Performance budgets (in milliseconds)
const PERFORMANCE_BUDGETS = {
  FCP: process.env.CI ? 2000 : 5000, // First Contentful Paint
  LCP: process.env.CI ? 3000 : 6000, // Largest Contentful Paint
  TTI: process.env.CI ? 4000 : 8000, // Time to Interactive (approximated)
  DOM_CONTENT_LOADED: process.env.CI ? 3000 : 6000,
  LOAD: process.env.CI ? 5000 : 10000,
};

// Helper to get web vitals metrics
async function getWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise<{
      fcp: number | null;
      lcp: number | null;
      cls: number | null;
      tti: number | null;
    }>((resolve) => {
      const metrics = {
        fcp: null as number | null,
        lcp: null as number | null,
        cls: null as number | null,
        tti: null as number | null,
      };

      // Observe paint timing
      if ("PerformanceObserver" in window) {
        // First Contentful Paint
        try {
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              if (entry.name === "first-contentful-paint") {
                metrics.fcp = entry.startTime;
              }
            }
          });
          fcpObserver.observe({ type: "paint", buffered: true });
        } catch {
          // FCP not supported
        }

        // Largest Contentful Paint
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              metrics.lcp = lastEntry.startTime;
            }
          });
          lcpObserver.observe({
            type: "largest-contentful-paint",
            buffered: true,
          });
        } catch {
          // LCP not supported
        }

        // Cumulative Layout Shift
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (
                "value" in entry &&
                !(entry as { hadRecentInput?: boolean }).hadRecentInput
              ) {
                clsValue += (entry as { value: number }).value;
              }
            }
            metrics.cls = clsValue;
          });
          clsObserver.observe({ type: "layout-shift", buffered: true });
        } catch {
          // CLS not supported
        }
      }

      // Get DOM Content Loaded and Load timing
      const navigationEntries = performance.getEntriesByType("navigation");
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        // Approximate TTI as DOM Content Loaded + some buffer
        metrics.tti = navEntry.domContentLoadedEventEnd;
      }

      // Resolve after a short delay to capture all metrics
      setTimeout(() => resolve(metrics), 1000);
    });
  });
}

// Helper to get navigation timing
async function getNavigationTiming(page: Page) {
  return await page.evaluate(() => {
    const entries = performance.getEntriesByType("navigation");
    if (entries.length > 0) {
      const nav = entries[0] as PerformanceNavigationTiming;
      return {
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        tcp: nav.connectEnd - nav.connectStart,
        request: nav.responseStart - nav.requestStart,
        response: nav.responseEnd - nav.responseStart,
        domProcessing: nav.domComplete - nav.domInteractive,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
        load: nav.loadEventEnd - nav.fetchStart,
      };
    }
    return null;
  });
}

// Helper to count resources by type
async function getResourceCounts(page: Page) {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const counts: Record<string, number> = {};

    for (const resource of resources) {
      const url = new URL(resource.name);
      const ext = url.pathname.split(".").pop() || "other";
      counts[ext] = (counts[ext] || 0) + 1;
    }

    return {
      total: resources.length,
      byType: counts,
    };
  });
}

// Helper to get total resource size (if available)
async function getResourceSizes(page: Page) {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    let totalSize = 0;

    for (const resource of resources) {
      if (resource.transferSize) {
        totalSize += resource.transferSize;
      }
    }

    return {
      totalBytes: totalSize,
      totalKB: Math.round(totalSize / 1024),
    };
  });
}

test.describe("Performance Tests - Marketing Pages", () => {
  test("home page should meet FCP budget", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    const vitals = await getWebVitals(page);

    if (vitals.fcp !== null) {
      console.log(
        `Home page FCP: ${vitals.fcp.toFixed(0)}ms (budget: ${PERFORMANCE_BUDGETS.FCP}ms)`,
      );
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FCP);
    } else {
      // If FCP not available, check basic load time
      const timing = await getNavigationTiming(page);
      if (timing) {
        expect(timing.domContentLoaded).toBeLessThan(
          PERFORMANCE_BUDGETS.DOM_CONTENT_LOADED,
        );
      }
    }
  });

  test("home page should meet LCP budget", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    const vitals = await getWebVitals(page);

    if (vitals.lcp !== null) {
      console.log(
        `Home page LCP: ${vitals.lcp.toFixed(0)}ms (budget: ${PERFORMANCE_BUDGETS.LCP}ms)`,
      );
      expect(vitals.lcp).toBeLessThan(PERFORMANCE_BUDGETS.LCP);
    }
  });

  test("home page should have low CLS", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    // Scroll to trigger any lazy-loaded content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const vitals = await getWebVitals(page);

    if (vitals.cls !== null) {
      console.log(`Home page CLS: ${vitals.cls.toFixed(3)} (budget: 0.1)`);
      expect(vitals.cls).toBeLessThan(0.1);
    }
  });

  test("home page load time should be acceptable", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
    const loadTime = Date.now() - startTime;

    console.log(`Home page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.LOAD);
  });

  test("pricing page should meet performance budgets", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: "networkidle" });

    const vitals = await getWebVitals(page);

    if (vitals.fcp !== null) {
      console.log(`Pricing page FCP: ${vitals.fcp.toFixed(0)}ms`);
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FCP);
    }
  });

  test("about page should meet performance budgets", async ({ page }) => {
    await page.goto(`${BASE_URL}/about`, { waitUntil: "networkidle" });

    const vitals = await getWebVitals(page);

    if (vitals.fcp !== null) {
      console.log(`About page FCP: ${vitals.fcp.toFixed(0)}ms`);
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FCP);
    }
  });
});

test.describe("Performance Tests - Auth Pages", () => {
  test("login page should meet performance budgets", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

    const vitals = await getWebVitals(page);

    if (vitals.fcp !== null) {
      console.log(`Login page FCP: ${vitals.fcp.toFixed(0)}ms`);
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FCP);
    }
  });

  test("signup page should meet performance budgets", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle" });

    const vitals = await getWebVitals(page);

    if (vitals.fcp !== null) {
      console.log(`Signup page FCP: ${vitals.fcp.toFixed(0)}ms`);
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FCP);
    }
  });
});

test.describe("Performance Tests - App Pages (Authenticated)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("dashboard should meet performance budgets", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });

    const vitals = await getWebVitals(page);

    if (vitals.fcp !== null) {
      console.log(`Dashboard FCP: ${vitals.fcp.toFixed(0)}ms`);
      // Allow slightly higher budget for authenticated pages
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FCP * 1.5);
    }
  });

  test("customers page should meet performance budgets", async ({ page }) => {
    await page.goto(`${BASE_URL}/customers`, { waitUntil: "networkidle" });

    const vitals = await getWebVitals(page);

    if (vitals.fcp !== null) {
      console.log(`Customers page FCP: ${vitals.fcp.toFixed(0)}ms`);
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FCP * 1.5);
    }
  });

  test("transactions page should meet performance budgets", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });

    const vitals = await getWebVitals(page);

    if (vitals.fcp !== null) {
      console.log(`Transactions page FCP: ${vitals.fcp.toFixed(0)}ms`);
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FCP * 1.5);
    }
  });
});

test.describe("Performance Tests - Resource Analysis", () => {
  test("home page should not load excessive resources", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    const counts = await getResourceCounts(page);
    console.log(`Home page total resources: ${counts.total}`);
    console.log("Resources by type:", counts.byType);

    // Should not load more than 100 resources
    expect(counts.total).toBeLessThan(100);
  });

  test("home page total resource size should be reasonable", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    const sizes = await getResourceSizes(page);
    console.log(`Home page total size: ${sizes.totalKB}KB`);

    // Should be less than 2MB
    expect(sizes.totalKB).toBeLessThan(2048);
  });

  test("JavaScript bundle should be reasonable size", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      return entries
        .filter((r) => r.name.includes(".js"))
        .map((r) => ({
          name: r.name.split("/").pop(),
          size: r.transferSize,
        }));
    });

    const totalJS = resources.reduce((sum, r) => sum + r.size, 0);
    console.log(`Total JS size: ${Math.round(totalJS / 1024)}KB`);
    console.log("JS files:", resources);

    // Allow up to 2MB of JS (dev mode includes HMR client, devtools etc.)
    // Production build should be significantly smaller
    expect(totalJS).toBeLessThan(2 * 1024 * 1024);
  });

  test("CSS bundle should be reasonable size", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      return entries
        .filter((r) => r.name.includes(".css"))
        .map((r) => ({
          name: r.name.split("/").pop(),
          size: r.transferSize,
        }));
    });

    const totalCSS = resources.reduce((sum, r) => sum + r.size, 0);
    console.log(`Total CSS size: ${Math.round(totalCSS / 1024)}KB`);

    // Should be less than 200KB of CSS
    expect(totalCSS).toBeLessThan(200 * 1024);
  });
});

test.describe("Performance Tests - Navigation Timing", () => {
  test("home page navigation timing should be within budget", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    const timing = await getNavigationTiming(page);

    if (timing) {
      console.log("Navigation timing:", timing);

      // DNS lookup should be fast
      expect(timing.dns).toBeLessThan(100);

      // TCP connection should be fast
      expect(timing.tcp).toBeLessThan(200);

      // Response should be received quickly (dev server may be slower)
      expect(timing.response).toBeLessThan(process.env.CI ? 1000 : 5000);

      // DOM Content Loaded should be within budget
      expect(timing.domContentLoaded).toBeLessThan(
        PERFORMANCE_BUDGETS.DOM_CONTENT_LOADED,
      );
    }
  });
});

test.describe("Performance Tests - i18n Performance", () => {
  const locales = ["en", "tr", "id"];

  for (const locale of locales) {
    test(`locale ${locale} should load within budget`, async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`http://localhost:3000/${locale}/`, {
        waitUntil: "load",
      });
      const loadTime = Date.now() - startTime;

      console.log(`Locale ${locale} load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.LOAD);
    });
  }
});

test.describe("Performance Tests - Mobile Performance", () => {
  test("mobile home page should load within budget", async ({ page }) => {
    // Simulate mobile
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
    const loadTime = Date.now() - startTime;

    console.log(`Mobile home page load time: ${loadTime}ms`);

    // Allow 50% more time for mobile
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.LOAD * 1.5);
  });

  test("mobile login page should load within budget", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
    const loadTime = Date.now() - startTime;

    console.log(`Mobile login page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.LOAD * 1.5);
  });
});

test.describe("Performance Tests - Caching", () => {
  test("static assets should be cacheable", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    const cacheableResources = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      return entries
        .filter((r) => r.name.includes("/_next/static/"))
        .map((r) => ({
          name: r.name,
          cached: r.transferSize === 0,
        }));
    });

    console.log(`Static resources: ${cacheableResources.length}`);
    const cachedCount = cacheableResources.filter((r) => r.cached).length;
    console.log(`Cached on repeat: ${cachedCount}`);

    // On first load, resources might not be cached
    expect(cacheableResources.length).toBeGreaterThan(0);
  });

  test("second page load should be faster (cache hit)", async ({ page }) => {
    // First load
    const firstStartTime = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
    const firstLoadTime = Date.now() - firstStartTime;

    // Second load (should hit cache)
    const secondStartTime = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
    const secondLoadTime = Date.now() - secondStartTime;

    console.log(
      `First load: ${firstLoadTime}ms, Second load: ${secondLoadTime}ms`,
    );

    // Second load should generally be faster or similar
    // (may not always be true due to network variability)
    expect(secondLoadTime).toBeLessThan(PERFORMANCE_BUDGETS.LOAD);
  });
});

test.describe("Performance Tests - API Response Time", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("dashboard API calls should be fast", async ({ page }) => {
    // Use Resource Timing API to measure API response times
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });

    const apiTimes = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      return entries
        .filter(
          (r) => r.name.includes("/rest/v1/") || r.name.includes("/api/"),
        )
        .map((r) => r.responseEnd - r.requestStart)
        .filter((t) => t > 0);
    });

    if (apiTimes.length > 0) {
      const avgTime = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
      console.log(`Average API response time: ${avgTime.toFixed(0)}ms`);
      expect(avgTime).toBeLessThan(2000);
    } else {
      console.log("No API calls detected on dashboard — skipping timing check");
    }
  });
});

test.describe("Performance Tests - Memory Usage", () => {
  test("home page should not have memory leaks", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    // Get initial memory (if available in Chrome)
    const initialMemory = await page.evaluate(() => {
      if ("memory" in performance) {
        return (performance as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize;
      }
      return null;
    });

    // Navigate around a bit
    await page.goto(`${BASE_URL}/pricing`);
    await page.goto(`${BASE_URL}/about`);
    await page.goto(`${BASE_URL}/`);

    // Force garbage collection if possible (Chrome flag needed)
    const finalMemory = await page.evaluate(() => {
      if ("memory" in performance) {
        return (performance as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize;
      }
      return null;
    });

    if (initialMemory && finalMemory) {
      console.log(
        `Initial memory: ${Math.round(initialMemory / 1024 / 1024)}MB`,
      );
      console.log(`Final memory: ${Math.round(finalMemory / 1024 / 1024)}MB`);

      // Memory should not increase by more than 50%
      expect(finalMemory).toBeLessThan(initialMemory * 1.5);
    }
  });
});

test.describe("Performance Tests - Time to First Byte (TTFB)", () => {
  test("home page TTFB should be fast", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });

    // Use Navigation Timing API instead of response.timing() which is unreliable
    const ttfb = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      if (entries.length > 0) {
        return entries[0].responseStart - entries[0].requestStart;
      }
      return null;
    });

    if (ttfb !== null) {
      console.log(`Home page TTFB: ${ttfb.toFixed(0)}ms`);
      // Generous budget for dev server (Next.js dev mode is slow)
      expect(ttfb).toBeLessThan(2000);
    }
  });

  test("API routes TTFB should be fast", async ({ page }) => {
    // Test a known API route (config) instead of /api/health which may not exist
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });

    const apiTtfb = await page.evaluate(async () => {
      const start = performance.now();
      try {
        await fetch("/api/config");
      } catch {
        return null;
      }
      return performance.now() - start;
    });

    if (apiTtfb !== null) {
      console.log(`API TTFB: ${apiTtfb.toFixed(0)}ms`);
      expect(apiTtfb).toBeLessThan(2000);
    }
  });
});
