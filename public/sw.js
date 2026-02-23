const CACHE_NAME = 'global-ledger-v3';
const OFFLINE_URL = '/offline.html';

// IndexedDB helper for service worker
const DB_NAME = 'global-ledger-offline';
const DB_VERSION = 2;
const SYNC_QUEUE_STORE = 'sync-queue';

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('action_type', 'action_type', { unique: false });
      }
    };
  });
}

// Get pending sync count from IndexedDB
async function getPendingSyncCount() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const index = store.index('status');
      const request = index.count('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to count pending items'));
    });
  } catch (error) {
    console.error('[SW] Error getting pending count:', error);
    return 0;
  }
}

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  OFFLINE_URL
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests and auth requests - always go to network
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/auth/') ||
      url.pathname.includes('supabase')) {
    return;
  }

  // For navigation requests, try network first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, return offline page
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // For other requests, try cache first, fall back to network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update cache in background
          event.waitUntil(
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME)
                    .then((cache) => cache.put(request, networkResponse));
                }
              })
              .catch(() => {/* Ignore network errors */})
          );
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {
            // For HTML pages, return offline page
            if (request.headers.get('Accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            // For other resources, return nothing
            return new Response('', { status: 408, statusText: 'Offline' });
          });
      })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-transactions' || event.tag === 'sync-all') {
    event.waitUntil(handleBackgroundSync());
  }
});

/**
 * Handle background sync by notifying the main app to process the sync queue.
 * The actual sync logic is in the TypeScript sync-processor which has access to
 * IndexedDB and Supabase client.
 */
async function handleBackgroundSync() {
  console.log('[SW] Handling background sync...');

  try {
    const pendingCount = await getPendingSyncCount();

    if (pendingCount === 0) {
      console.log('[SW] No pending items to sync');
      return;
    }

    console.log(`[SW] Found ${pendingCount} pending items`);

    // Notify all clients to process their sync queues
    const clients = await self.clients.matchAll({ type: 'window' });

    if (clients.length === 0) {
      console.log('[SW] No active clients to notify');
      // Schedule a retry for when a client becomes available
      return;
    }

    // Send message to all clients to trigger sync
    clients.forEach((client) => {
      client.postMessage({
        type: 'PROCESS_SYNC_QUEUE',
        pendingCount,
        timestamp: Date.now()
      });
    });

    console.log('[SW] Notified clients to process sync queue');
  } catch (error) {
    console.error('[SW] Background sync error:', error);
    throw error; // This will cause the sync to be retried
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data?.json() || {};
  const title = data.title || 'Global Ledger';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [100, 50, 100],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }

  // Handle manual sync trigger from main app
  if (event.data.type === 'TRIGGER_SYNC') {
    event.waitUntil(handleBackgroundSync());
  }

  // Respond with pending sync count
  if (event.data.type === 'GET_PENDING_COUNT') {
    getPendingSyncCount()
      .then((count) => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ count });
        }
      })
      .catch(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ count: 0 });
        }
      });
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);

  if (event.tag === 'sync-transactions-periodic') {
    event.waitUntil(handleBackgroundSync());
  }
});
