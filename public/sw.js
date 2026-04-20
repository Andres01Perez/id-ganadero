// JPS Ganadería SW v3
// - Cache-first para imágenes generales (animal-fotos, etc).
// - Stale-while-revalidate para /app-assets/ (banners editables del superadmin)
//   para que cambios se vean al instante sin bloquear render.
// - Nunca cachea HTML/JS/CSS (useAppUpdate.tsx maneja versionado).

const IMG_CACHE = 'jps-images-v2';

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

  const isImageExt = /\.(webp|jpg|jpeg|png|svg|gif|avif)$/i.test(url.pathname);
  const isSupabaseStorage =
    url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/');

  if (!isImageExt && !isSupabaseStorage) return;

  const isAppAsset = url.pathname.includes('/app-assets/');

  event.respondWith((async () => {
    const cache = await caches.open(IMG_CACHE);
    const cached = await cache.match(event.request);

    if (isAppAsset) {
      // Stale-while-revalidate
      const networkPromise = fetch(event.request)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            try {
              cache.put(event.request, res.clone());
            } catch {
              // ignore
            }
          }
          return res;
        })
        .catch(() => null);

      if (cached) {
        // No esperamos la red; se actualiza en background para próxima carga
        event.waitUntil(networkPromise);
        return cached;
      }
      const fresh = await networkPromise;
      if (fresh) return fresh;
      throw new Error('app-asset network failed and no cache');
    }

    // Cache-first para el resto
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      if (res && (res.ok || res.type === 'opaque')) {
        try {
          cache.put(event.request, res.clone());
        } catch {
          // ignore
        }
      }
      return res;
    } catch (err) {
      const fallback = await cache.match(event.request);
      if (fallback) return fallback;
      throw err;
    }
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data;

  if (data === 'CLEAR_IMG_CACHE') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    })());
    return;
  }

  if (data && typeof data === 'object' && data.type === 'PURGE_ASSET' && data.url) {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(IMG_CACHE);
        await cache.delete(data.url);
      } catch {
        // ignore
      }
    })());
  }
});
