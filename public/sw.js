// Killer Service Worker
// Reemplaza cualquier SW viejo (vite-plugin-pwa/Workbox) y se auto-desregistra.
// Debe permanecer en producción permanentemente para liberar dispositivos atrapados.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      await self.registration.unregister();
    } catch (e) {
      // ignore
    }
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {
      // ignore
    }
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        try {
          client.navigate(client.url);
        } catch (e) {
          // ignore
        }
      });
    } catch (e) {
      // ignore
    }
  })());
});
