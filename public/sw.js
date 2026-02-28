/**
 * Ledgerly Service Worker
 *
 * Dev-mode compatible: no pre-caching (avoids redirect issues with '/' → '/en').
 * Cache fills lazily through the fetch handler.
 *
 * In production, @ducanh2912/next-pwa replaces this file with a workbox-powered SW.
 */

const CACHE_NAME = 'global-ledger-v3';
const OFFLINE_URL = '/offline.html';

// ─── Install ────────────────────────────────────────────────────────────────
// No pre-caching — skipWaiting immediately so SW activates right away.

self.addEventListener('install', () => {
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (!cacheWhitelist.includes(name)) {
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin
  if (url.origin !== location.origin) return;

  // Skip API / auth / supabase — always network
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.includes('supabase')
  ) return;

  // Skip Next.js internals (HMR etc.)
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // Navigation: network first, offline.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// ─── Background Sync ────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions' || event.tag === 'sync-all') {
    event.waitUntil(notifyClientsToSync());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-transactions-periodic') {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage({ type: 'PROCESS_SYNC_QUEUE', timestamp: Date.now() });
  });
}

// ─── Push Notifications ─────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ledgerly', {
      body: data.body || 'Yeni bir bildirim var',
      icon: '/icons/icon.svg',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin));
        if (existing) return existing.focus();
        return self.clients.openWindow('/');
      })
  );
});

// ─── Message Handling ───────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'TRIGGER_SYNC') event.waitUntil(notifyClientsToSync());
  if (event.data?.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(event.data.urls || []))
    );
  }
  if (event.data?.type === 'GET_PENDING_COUNT') {
    if (event.ports?.[0]) event.ports[0].postMessage({ count: 0 });
  }
});
