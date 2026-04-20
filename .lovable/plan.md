

## Auditoría del punto ciego

Tienes razón. El killswitch en `main.tsx` solo funciona si el usuario logra descargar el nuevo `main.tsx`. Pero `vite-plugin-pwa` con estrategia `precacheAndRoute` cachea **todos los assets con hash** y sirve `index.html` desde cache, que apunta a los JS viejos. El usuario puede quedar atrapado en un loop sirviendo siempre la versión vieja.

La solución del "Service Worker Asesino" resuelve esto porque:
- El navegador chequea `sw.js` por byte-diff cada ~24h o en cada navegación (esto NO se cachea como otros assets, es regla del estándar SW).
- Cuando detecta que el contenido cambió (de Workbox precache → killer), instala el nuevo, ejecuta `activate`, y el nuevo SW se auto-desregistra + borra caches + recarga pestañas.

## Plan: añadir el Service Worker Asesino

### 1. Crear `public/sw.js`
Archivo nuevo con el killer SW. Se sirve desde la raíz (`/sw.js`), exactamente la ruta donde `vite-plugin-pwa` registraba el SW viejo, así el navegador detecta el cambio y lo reemplaza.

```js
// public/sw.js
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', async (event) => {
  event.waitUntil((async () => {
    await self.registration.unregister();
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.navigate(client.url));
  })());
});
```

### 2. Mantener killswitch en `main.tsx` como red de seguridad
El killswitch que ya tienes sigue siendo útil para usuarios que entran por primera vez al navegador (sin SW viejo) o si algo falla en `sw.js`. No lo tocamos.

### 3. Confirmar que `index.html` no precarga ni registra `sw.js`
Verificar que no haya un `<link rel="serviceworker">` ni un `navigator.serviceWorker.register('/sw.js')` en ningún lado. El killer SW solo necesita ser **descubierto y reemplazado** por el navegador en su chequeo automático del SW ya registrado — no hay que registrarlo activamente.

### 4. Cómo funciona la migración

| Estado del usuario | Qué pasa |
|---|---|
| PWA con SW viejo de Workbox | Navegador chequea `/sw.js`, detecta diff, instala killer, killer se desregistra + limpia caches + recarga → versión nueva |
| Navegador web normal sin SW | El killswitch de `main.tsx` limpia cualquier resto + recarga → versión nueva |
| Usuario nuevo | Carga directo desde servidor, no hay SW, todo limpio |

### 5. Consideración importante
El killer SW debe **quedarse en producción permanentemente** (al menos varios meses). Si lo borras, los navegadores que aún no lo procesaron seguirán con el Workbox viejo. Es un archivo de 15 líneas, no molesta.

## Archivos

| Archivo | Cambio |
|---|---|
| `public/sw.js` | **Crear** con el killer SW (install: skipWaiting, activate: unregister + clear caches + reload clients) |

