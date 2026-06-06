// ============================================================
// Rwive Service Worker — Network-First Strategy
// Cache version is stamped at build time via __CACHE_VERSION__.
// HTML and JS always fetch from network first; cache is only a
// fallback when the user is genuinely offline.
// ============================================================

const CACHE_VERSION = 'rwive-cache-20260607-3';   // ← bump this on every push
const STATIC_CACHE  = 'rwive-static-v1';           // icons only — rarely change

// Assets that are safe to cache permanently (icons, manifest)
const STATIC_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
  '/manifest.webmanifest',
];

// ---- Install: pre-cache static assets only --------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-fatal — icon files might not exist yet
      })
    )
  );
  // Take control immediately — do NOT wait for old SW to die
  self.skipWaiting();
});

// ---- Activate: delete ALL old dynamic caches ------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          // Keep current static cache; delete everything else
          if (key !== STATIC_CACHE) {
            console.log('[SW] Deleting stale cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ---- Fetch: Network-First for everything except static assets --
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip: HMR websocket, chrome-extension, supabase API calls
  if (
    url.pathname.includes('/_next/webpack-hmr') ||
    url.protocol === 'chrome-extension:' ||
    url.hostname.includes('supabase.co')
  ) {
    return;
  }

  // Static assets (icons) — cache-first
  if (STATIC_ASSETS.some((a) => url.pathname === a)) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request)
      )
    );
    return;
  }

  // Everything else (HTML, JS chunks, CSS) — NETWORK FIRST
  // Only serve from cache when network fails (offline mode)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a copy for offline use
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) =>
            cache.put(event.request, clone)
          );
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // If no cached match for an HTML request, serve cached root
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});
