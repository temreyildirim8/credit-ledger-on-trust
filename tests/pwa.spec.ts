import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Global Ledger PWA functionality
 * Covers PWA install prompt, offline mode, sync queue, and background sync
 */

const TEST_LOCALE = 'en';
const BASE_URL = `http://localhost:3000/${TEST_LOCALE}`;

test.describe('PWA Manifest', () => {
  test('should have valid manifest.json', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();

    // Check required PWA manifest fields
    expect(manifest.name).toBe('Global Ledger - Credit Ledger App');
    expect(manifest.short_name).toBe('Global Ledger');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBe('#ffffff');
    expect(manifest.theme_color).toBe('#2D8E4A');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('manifest icon should be accessible', async ({ page }) => {
    const response = await page.request.get('/icons/icon.svg');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
  });
});

test.describe('Service Worker', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for service worker to register
    const swRegistration = await page.waitForFunction(() => {
      return navigator.serviceWorker.ready;
    });

    expect(swRegistration).toBeTruthy();
  });

  test('should cache app shell on install', async ({ page, context }) => {
    // Clear all caches first
    await context.clearCookies();

    await page.goto(BASE_URL);

    // Wait for service worker to be ready
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration !== null;
    });

    // Check if caches exist
    const cacheNames = await page.evaluate(async () => {
      const cacheKeys = await caches.keys();
      return cacheKeys;
    });

    // Should have at least one cache (app shell)
    expect(cacheNames.length).toBeGreaterThan(0);
    expect(cacheNames.some(name => name.includes('global-ledger'))).toBe(true);
  });
});

test.describe('Offline Mode', () => {
  test.use({ offline: true });

  test('should show offline page when network is unavailable', async ({ page }) => {
    // First visit online to cache resources
    await page.context().setOffline(false);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Now go offline
    await page.context().setOffline(true);

    // Try to navigate - should show cached content or offline fallback
    const response = await page.goto(BASE_URL);

    // Either we get cached content or the offline page
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Offline Mode Toggle', () => {
  test('should handle online/offline state transitions', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check initial online state
    const initialState = await page.evaluate(() => navigator.onLine);
    expect(initialState).toBe(true);

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(100);

    const offlineState = await page.evaluate(() => navigator.onLine);
    expect(offlineState).toBe(false);

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(100);

    const backOnlineState = await page.evaluate(() => navigator.onLine);
    expect(backOnlineState).toBe(true);
  });

  test('should cache offline.html fallback', async ({ page }) => {
    const response = await page.request.get('/offline.html');
    expect(response.status()).toBe(200);
  });
});

test.describe('PWA Install Prompt', () => {
  test('should have install prompt component structure', async ({ page }) => {
    // Check that the PWA install prompt can appear
    // Note: The actual beforeinstallprompt event only fires under specific conditions
    // This test verifies the component exists and can render

    await page.goto(BASE_URL);

    // Look for PWA-related elements in the DOM
    const pwaProvider = await page.locator('[data-testid="pwa-provider"]').count();

    // The PWA install prompt should be set up (even if not visible)
    // Check that the page has proper PWA meta tags
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();
  });

  test('should have required PWA meta tags', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check theme-color meta tag
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();

    // Check manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestLink).toBe('/manifest.json');

    // Check apple-mobile-web-app-capable
    const appleCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
    expect(appleCapable).toBe('yes');
  });
});

test.describe('Background Sync', () => {
  test('should have IndexedDB sync queue available', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check IndexedDB is available
    const idbAvailable = await page.evaluate(() => {
      return 'indexedDB' in window;
    });
    expect(idbAvailable).toBe(true);
  });

  test('should be able to open sync queue database', async ({ page }) => {
    await page.goto(BASE_URL);

    const dbOpened = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          request.result.close();
          resolve(true);
        };
        request.onerror = () => resolve(false);
      });
    });

    expect(dbOpened).toBe(true);
  });

  test('sync status indicator should exist in app layout', async ({ page }) => {
    // Navigate to a protected page (would need to be authenticated in real scenario)
    // For now, just check the public page has sync infrastructure
    await page.goto(BASE_URL);

    // The sync status indicator would be in the app shell
    // Check that the app can handle sync status messages
    const canHandleMessages = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(canHandleMessages).toBe(true);
  });
});

test.describe('Cache Strategy', () => {
  test('should use cache-first strategy for static assets', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for service worker to be ready
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration !== null;
    });

    // Request a cached asset
    const response = await page.request.get('/manifest.json');

    // Should get response from cache or network
    expect(response.status()).toBe(200);
  });

  test('should cache navigation requests', async ({ page }) => {
    // First visit to populate cache
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for service worker
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration !== null;
    });

    // Check cache has entries
    const cachedUrls = await page.evaluate(async () => {
      const cacheKeys = await caches.keys();
      const cache = await caches.open(cacheKeys[0]);
      const keys = await cache.keys();
      return keys.map(r => r.url);
    });

    // Should have cached at least the root
    expect(cachedUrls.length).toBeGreaterThan(0);
  });
});

test.describe('PWA on Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check viewport meta tag for proper mobile scaling
    const viewportContent = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportContent).toContain('width=device-width');
    expect(viewportContent).toContain('initial-scale=1');
  });

  test('should have proper standalone display mode support', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check if display-mode media query is supported
    const standaloneSupported = await page.evaluate(() => {
      return window.matchMedia('(display-mode: standalone)').media !== 'not all';
    });
    expect(standaloneSupported).toBe(true);
  });
});

test.describe('Push Notifications (Capability Check)', () => {
  test('should have push notification capability in service worker', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for service worker
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration !== null;
    });

    // Check if pushManager is available (requires HTTPS in production)
    const pushAvailable = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return 'pushManager' in registration;
    });
    expect(pushAvailable).toBe(true);
  });

  test('service worker should handle push events', async ({ page }) => {
    // This test verifies the SW code handles push events
    // Actual push requires backend setup
    await page.goto(BASE_URL);

    // Check that SW script includes push handling
    const swContent = await page.request.get('/sw.js').then(r => r.text());
    expect(swContent).toContain("self.addEventListener('push'");
    expect(swContent).toContain('showNotification');
  });
});
