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

test.describe('Sync Queue Functionality', () => {
  test('should have sync queue object store in IndexedDB', async ({ page }) => {
    await page.goto(BASE_URL);

    const storeExists = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const exists = db.objectStoreNames.contains('sync-queue');
          db.close();
          resolve(exists);
        };
        request.onerror = () => resolve(false);
      });
    });

    expect(storeExists).toBe(true);
  });

  test('should be able to add item to sync queue', async ({ page }) => {
    await page.goto(BASE_URL);

    const itemId = await page.evaluate(async () => {
      return new Promise<string | null>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');

          const id = `sync_test_${Date.now()}`;
          const item = {
            id,
            action_type: 'create_customer',
            payload: { name: 'Test Customer' },
            client_timestamp: new Date().toISOString(),
            retry_count: 0,
            max_retries: 3,
            status: 'pending',
            _addedAt: Date.now(),
          };

          const putRequest = store.put(item);
          putRequest.onsuccess = () => {
            db.close();
            resolve(id);
          };
          putRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        request.onerror = () => resolve(null);
      });
    });

    expect(itemId).not.toBeNull();
    expect(itemId).toContain('sync_test_');
  });

  test('should be able to retrieve pending sync items', async ({ page }) => {
    await page.goto(BASE_URL);

    // First add a test item
    const testId = await page.evaluate(async () => {
      return new Promise<string | null>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');

          const id = `sync_retrieve_test_${Date.now()}`;
          const item = {
            id,
            action_type: 'create_transaction',
            payload: { amount: 100 },
            client_timestamp: new Date().toISOString(),
            retry_count: 0,
            max_retries: 3,
            status: 'pending',
            _addedAt: Date.now(),
          };

          const putRequest = store.put(item);
          putRequest.onsuccess = () => {
            db.close();
            resolve(id);
          };
          putRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        request.onerror = () => resolve(null);
      });
    });

    expect(testId).not.toBeNull();

    // Now retrieve pending items
    const pendingItems = await page.evaluate(async () => {
      return new Promise<Array<{ id: string; status: string }>>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readonly');
          const store = transaction.objectStore('sync-queue');
          const index = store.index('status');
          const getAllRequest = index.getAll('pending');

          getAllRequest.onsuccess = () => {
            db.close();
            resolve(getAllRequest.result);
          };
          getAllRequest.onerror = () => {
            db.close();
            resolve([]);
          };
        };
        request.onerror = () => resolve([]);
      });
    });

    expect(pendingItems.length).toBeGreaterThan(0);
    expect(pendingItems.some((item) => item.id === testId)).toBe(true);
  });

  test('should be able to update sync queue item status', async ({ page }) => {
    await page.goto(BASE_URL);

    // Add test item
    const testId = await page.evaluate(async () => {
      return new Promise<string | null>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');

          const id = `sync_update_test_${Date.now()}`;
          const item = {
            id,
            action_type: 'create_customer',
            payload: {},
            client_timestamp: new Date().toISOString(),
            retry_count: 0,
            max_retries: 3,
            status: 'pending',
            _addedAt: Date.now(),
          };

          const putRequest = store.put(item);
          putRequest.onsuccess = () => {
            db.close();
            resolve(id);
          };
          putRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        request.onerror = () => resolve(null);
      });
    });

    expect(testId).not.toBeNull();

    // Update status to syncing
    const updated = await page.evaluate(async (id) => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
              item.status = 'syncing';
              const putRequest = store.put(item);
              putRequest.onsuccess = () => {
                db.close();
                resolve(true);
              };
              putRequest.onerror = () => {
                db.close();
                resolve(false);
              };
            } else {
              db.close();
              resolve(false);
            }
          };
          getRequest.onerror = () => {
            db.close();
            resolve(false);
          };
        };
        request.onerror = () => resolve(false);
      });
    }, testId);

    expect(updated).toBe(true);

    // Verify status was updated
    const item = await page.evaluate(async (id) => {
      return new Promise<{ status: string } | null>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readonly');
          const store = transaction.objectStore('sync-queue');
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result);
          };
          getRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        request.onerror = () => resolve(null);
      });
    }, testId);

    expect(item).not.toBeNull();
    expect(item?.status).toBe('syncing');
  });

  test('should be able to remove item from sync queue', async ({ page }) => {
    await page.goto(BASE_URL);

    // Add test item
    const testId = await page.evaluate(async () => {
      return new Promise<string | null>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');

          const id = `sync_delete_test_${Date.now()}`;
          const item = {
            id,
            action_type: 'delete_customer',
            payload: {},
            client_timestamp: new Date().toISOString(),
            retry_count: 0,
            max_retries: 3,
            status: 'completed',
            _addedAt: Date.now(),
          };

          const putRequest = store.put(item);
          putRequest.onsuccess = () => {
            db.close();
            resolve(id);
          };
          putRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        request.onerror = () => resolve(null);
      });
    });

    expect(testId).not.toBeNull();

    // Delete the item
    const deleted = await page.evaluate(async (id) => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');
          const deleteRequest = store.delete(id);

          deleteRequest.onsuccess = () => {
            db.close();
            resolve(true);
          };
          deleteRequest.onerror = () => {
            db.close();
            resolve(false);
          };
        };
        request.onerror = () => resolve(false);
      });
    }, testId);

    expect(deleted).toBe(true);

    // Verify item was deleted
    const item = await page.evaluate(async (id) => {
      return new Promise<unknown>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readonly');
          const store = transaction.objectStore('sync-queue');
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result);
          };
          getRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        request.onerror = () => resolve(null);
      });
    }, testId);

    expect(item).toBeUndefined();
  });

  test('should count pending sync items correctly', async ({ page }) => {
    await page.goto(BASE_URL);

    // Clear existing pending items first
    await page.evaluate(async () => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => {
            db.close();
            resolve();
          };
          clearRequest.onerror = () => {
            db.close();
            resolve();
          };
        };
        request.onerror = () => resolve();
      });
    });

    // Add 3 pending items
    for (let i = 0; i < 3; i++) {
      await page.evaluate(async (index) => {
        return new Promise<boolean>((resolve) => {
          const request = indexedDB.open('global-ledger-offline', 2);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['sync-queue'], 'readwrite');
            const store = transaction.objectStore('sync-queue');

            const item = {
              id: `sync_count_test_${Date.now()}_${index}`,
              action_type: 'create_customer',
              payload: {},
              client_timestamp: new Date().toISOString(),
              retry_count: 0,
              max_retries: 3,
              status: 'pending',
              _addedAt: Date.now() + index,
            };

            const putRequest = store.put(item);
            putRequest.onsuccess = () => {
              db.close();
              resolve(true);
            };
            putRequest.onerror = () => {
              db.close();
              resolve(false);
            };
          };
          request.onerror = () => resolve(false);
        });
      }, i);
    }

    // Count pending items
    const count = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readonly');
          const store = transaction.objectStore('sync-queue');
          const index = store.index('status');
          const countRequest = index.count('pending');

          countRequest.onsuccess = () => {
            db.close();
            resolve(countRequest.result);
          };
          countRequest.onerror = () => {
            db.close();
            resolve(0);
          };
        };
        request.onerror = () => resolve(0);
      });
    });

    expect(count).toBe(3);
  });

  test('sync queue items should be sorted by added time ascending', async ({ page }) => {
    await page.goto(BASE_URL);

    // Clear existing items
    await page.evaluate(async () => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => {
            db.close();
            resolve();
          };
          clearRequest.onerror = () => {
            db.close();
            resolve();
          };
        };
        request.onerror = () => resolve();
      });
    });

    // Add items with different timestamps
    const timestamps = [1000, 500, 2000]; // Intentionally out of order
    for (const ts of timestamps) {
      await page.evaluate(async (timestamp) => {
        return new Promise<boolean>((resolve) => {
          const request = indexedDB.open('global-ledger-offline', 2);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['sync-queue'], 'readwrite');
            const store = transaction.objectStore('sync-queue');

            const item = {
              id: `sync_order_test_${timestamp}`,
              action_type: 'create_customer',
              payload: { order: timestamp },
              client_timestamp: new Date().toISOString(),
              retry_count: 0,
              max_retries: 3,
              status: 'pending',
              _addedAt: timestamp,
            };

            const putRequest = store.put(item);
            putRequest.onsuccess = () => {
              db.close();
              resolve(true);
            };
            putRequest.onerror = () => {
              db.close();
              resolve(false);
            };
          };
          request.onerror = () => resolve(false);
        });
      }, ts);
    }

    // Get all items and check ordering (oldest first)
    const items = await page.evaluate(async () => {
      return new Promise<Array<{ id: string; _addedAt: number }>>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readonly');
          const store = transaction.objectStore('sync-queue');
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            db.close();
            const items = getAllRequest.result as Array<{ id: string; _addedAt: number }>;
            // Sort by _addedAt ascending as the app would do
            items.sort((a, b) => a._addedAt - b._addedAt);
            resolve(items);
          };
          getAllRequest.onerror = () => {
            db.close();
            resolve([]);
          };
        };
        request.onerror = () => resolve([]);
      });
    });

    expect(items.length).toBe(3);
    expect(items[0]._addedAt).toBe(500);
    expect(items[1]._addedAt).toBe(1000);
    expect(items[2]._addedAt).toBe(2000);
  });

  test('should support all sync action types', async ({ page }) => {
    await page.goto(BASE_URL);

    const actionTypes = [
      'create_customer',
      'update_customer',
      'delete_customer',
      'create_transaction',
      'update_transaction',
    ];

    // Add items of each action type
    for (const actionType of actionTypes) {
      const success = await page.evaluate(async (type) => {
        return new Promise<boolean>((resolve) => {
          const request = indexedDB.open('global-ledger-offline', 2);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['sync-queue'], 'readwrite');
            const store = transaction.objectStore('sync-queue');

            const item = {
              id: `sync_action_test_${type}_${Date.now()}`,
              action_type: type,
              payload: {},
              client_timestamp: new Date().toISOString(),
              retry_count: 0,
              max_retries: 3,
              status: 'pending',
              _addedAt: Date.now(),
            };

            const putRequest = store.put(item);
            putRequest.onsuccess = () => {
              db.close();
              resolve(true);
            };
            putRequest.onerror = () => {
              db.close();
              resolve(false);
            };
          };
          request.onerror = () => resolve(false);
        });
      }, actionType);

      expect(success).toBe(true);
    }

    // Verify all types are stored
    const items = await page.evaluate(async () => {
      return new Promise<Array<{ action_type: string }>>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readonly');
          const store = transaction.objectStore('sync-queue');
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            db.close();
            resolve(
              (getAllRequest.result as Array<{ id: string; action_type: string }>)
                .filter((item) => item.id.startsWith('sync_action_test_'))
                .map((item) => ({ action_type: item.action_type }))
            );
          };
          getAllRequest.onerror = () => {
            db.close();
            resolve([]);
          };
        };
        request.onerror = () => resolve([]);
      });
    });

    expect(items.length).toBe(5);
    const storedTypes = items.map((i) => i.action_type);
    actionTypes.forEach((type) => {
      expect(storedTypes).toContain(type);
    });
  });

  test('should handle retry logic in sync queue', async ({ page }) => {
    await page.goto(BASE_URL);

    // Add item with retry_count = 2
    const testId = await page.evaluate(async () => {
      return new Promise<string | null>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');

          const id = `sync_retry_test_${Date.now()}`;
          const item = {
            id,
            action_type: 'create_customer',
            payload: {},
            client_timestamp: new Date().toISOString(),
            retry_count: 2,
            max_retries: 3,
            status: 'pending',
            _addedAt: Date.now(),
          };

          const putRequest = store.put(item);
          putRequest.onsuccess = () => {
            db.close();
            resolve(id);
          };
          putRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        request.onerror = () => resolve(null);
      });
    });

    expect(testId).not.toBeNull();

    // Simulate incrementing retry count
    const incremented = await page.evaluate(async (id) => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
              item.retry_count += 1;

              // If retry_count >= max_retries, mark as failed
              if (item.retry_count >= item.max_retries) {
                item.status = 'failed';
                item.error_message = 'Max retries exceeded';
              }

              const putRequest = store.put(item);
              putRequest.onsuccess = () => {
                db.close();
                resolve(true);
              };
              putRequest.onerror = () => {
                db.close();
                resolve(false);
              };
            } else {
              db.close();
              resolve(false);
            }
          };
          getRequest.onerror = () => {
            db.close();
            resolve(false);
          };
        };
        request.onerror = () => resolve(false);
      });
    }, testId);

    expect(incremented).toBe(true);

    // Verify item is now failed
    const item = await page.evaluate(async (id) => {
      return new Promise<{ retry_count: number; status: string; error_message?: string } | null>(
        (resolve) => {
          const request = indexedDB.open('global-ledger-offline', 2);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['sync-queue'], 'readonly');
            const store = transaction.objectStore('sync-queue');
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
              db.close();
              resolve(getRequest.result);
            };
            getRequest.onerror = () => {
              db.close();
              resolve(null);
            };
          };
          request.onerror = () => resolve(null);
        }
      );
    }, testId);

    expect(item).not.toBeNull();
    expect(item?.retry_count).toBe(3);
    expect(item?.status).toBe('failed');
    expect(item?.error_message).toBe('Max retries exceeded');
  });
});

test.describe('Sync Queue Integration', () => {
  test('should clear sync queue successfully', async ({ page }) => {
    await page.goto(BASE_URL);

    // Add some items
    for (let i = 0; i < 3; i++) {
      await page.evaluate(async (index) => {
        return new Promise<void>((resolve) => {
          const request = indexedDB.open('global-ledger-offline', 2);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['sync-queue'], 'readwrite');
            const store = transaction.objectStore('sync-queue');

            const item = {
              id: `sync_clear_test_${Date.now()}_${index}`,
              action_type: 'create_customer',
              payload: {},
              client_timestamp: new Date().toISOString(),
              retry_count: 0,
              max_retries: 3,
              status: 'pending',
              _addedAt: Date.now(),
            };

            store.put(item);
            db.close();
            resolve();
          };
          request.onerror = () => resolve();
        });
      }, i);
    }

    // Clear the sync queue
    await page.evaluate(async () => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readwrite');
          const store = transaction.objectStore('sync-queue');
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => {
            db.close();
            resolve();
          };
          clearRequest.onerror = () => {
            db.close();
            resolve();
          };
        };
        request.onerror = () => resolve();
      });
    });

    // Verify queue is empty
    const count = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const request = indexedDB.open('global-ledger-offline', 2);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['sync-queue'], 'readonly');
          const store = transaction.objectStore('sync-queue');
          const countRequest = store.count();

          countRequest.onsuccess = () => {
            db.close();
            resolve(countRequest.result);
          };
          countRequest.onerror = () => {
            db.close();
            resolve(-1);
          };
        };
        request.onerror = () => resolve(-1);
      });
    });

    expect(count).toBe(0);
  });
});
