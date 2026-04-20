// JPS Ganadería SW v2 — cache-first ONLY for images.
// Never caches HTML/JS/CSS to avoid breaking app updates.
// useAppUpdate.tsx handles version detection by hashing index.html.

const IMG_CACHE = 'jps-images-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== IMG_CACHE).map((k) => caches.delete(k))
      );
    } catch (e) {
      // ignore
    }
    try {
      await self.clients.claim();
    } catch (e) {
      // ignore
    }
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  // Only intercept images. Everything else: browser default behavior (no SW interference).
  const isImageExt = /\.(webp|jpg|jpeg|png|svg|gif|avif)$/i.test(url.pathname);
  const isSupabaseStorage =
    url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/');

  if (!isImageExt && !isSupabaseStorage) return;

  event.respondWith((async () => {
    try {
      const cache = await caches.open(IMG_CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const res = await fetch(event.request);
      // Only cache successful, non-opaque-error responses
      if (res && (res.ok || res.type === 'opaque')) {
        try {
          cache.put(event.request, res.clone());
        } catch {
          // ignore quota/clone errors
        }
      }
      return res;
    } catch (err) {
      // Network failed, no cache: rethrow so the browser shows broken image
      const cache = await caches.open(IMG_CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      throw err;
    }
  })());
});

// Allow page to trigger a full purge (used by "limpiar caché" button)
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_IMG_CACHE') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    })());
  }
});
