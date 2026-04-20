

## Adendum al plan de SW: garantías de actualización

Mantener todo lo del plan anterior (cache-first para imágenes + precarga + skeletons), añadiendo estas salvaguardas:

### 1. El SW NUNCA cachea HTML, JS ni CSS
```js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Solo interceptar imágenes. Todo lo demás pasa directo a la red.
  const isImage =
    /\.(webp|jpg|jpeg|png|svg|gif|avif)$/i.test(url.pathname) ||
    (url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/'));
  
  if (!isImage) return; // ← clave: no llamar respondWith → comportamiento normal del navegador
  
  // ... cache-first para imágenes
});
```
Al no llamar `event.respondWith()` para no-imágenes, el navegador maneja esos requests como si el SW no existiera. **Cero riesgo de servir HTML/JS viejo.**

### 2. SW con auto-update agresivo
```js
self.addEventListener('install', (e) => {
  self.skipWaiting(); // nueva versión activa de inmediato
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Borrar caches viejos de versiones anteriores
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== IMG_CACHE).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});
```

### 3. `useAppUpdate.tsx` queda intacto
Sigue detectando bundles nuevos por hash en `index.html`. El SW no interfiere porque no cachea HTML.

### 4. Botón de "limpiar caché" como red de seguridad (opcional, recomendado)
Añadir un pequeño botón en `Menu.tsx` o `VersionFooter.tsx` (oculto en un long-press o en la pantalla de admin) que ejecute:
```ts
const clearImageCache = async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map(r => r.unregister()));
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  window.location.reload();
};
```
Si alguna vez algo se atasca, el usuario (o tú remotamente diciéndole "mantén pulsado el versión abajo") puede limpiar todo en 1 toque. Es la versión "boton de pánico" del antiguo killer SW, pero on-demand en vez de automático.

### 5. Registro condicional (igual que ya tienes en `useAppUpdate`)
```ts
// src/main.tsx
if ('serviceWorker' in navigator) {
  const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const isPreview = location.hostname.includes('id-preview--') 
    || location.hostname.includes('lovableproject.com')
    || location.hostname === 'localhost';
  
  if (!isInIframe && !isPreview) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  } else {
    // En preview/iframe: desregistrar cualquier SW existente (mantiene el comportamiento actual)
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  }
}
```

### Resumen de garantías

| Escenario | Resultado |
|---|---|
| Publicas versión nueva | `useAppUpdate` detecta hash nuevo → toast → reload → bundle nuevo. **Igual que hoy.** |
| Subes foto nueva de un animal | URL nueva (Supabase la genera única) → no está en caché → se descarga. La vieja queda huérfana en caché pero no estorba. |
| Cambias estilo/lógica de la app | Bundle nuevo con hash distinto → navegador lo pide fresco (SW no toca JS/CSS). |
| Algo se atasca raro | Botón "limpiar caché" desregistra SW + borra todo + reload. |
| Usuario abre la app en el editor de Lovable (iframe) | SW no se registra. Si había uno viejo, se desregistra. |

Riesgo neto vs estado actual: **mismo riesgo de actualización, mucho mejor UX de imágenes.**

