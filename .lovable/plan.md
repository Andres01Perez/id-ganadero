

## Diagnóstico: por qué el cache es tan agresivo

Revisé tu config y encontré **3 capas de cache** acumulándose:

### 1. Service Worker con `autoUpdate` + precaching agresivo (`vite.config.ts`)
```ts
VitePWA({
  registerType: "autoUpdate",
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
    skipWaiting: true,
    clientsClaim: true,
  },
})
```
Esto hace **precache de TODO el build**: JS, CSS, HTML, imágenes, fuentes. El SW sirve la versión vieja desde cache hasta que detecta una nueva, descarga, y recién ahí actualiza. En móvil con conexión intermitente, ese chequeo puede tardar **horas o días**.

### 2. `PwaUpdatePrompt` solo chequea cada 60s **mientras la app está abierta**
Si cierras la PWA antes de los 60s, nunca detecta el update. Al reabrir, el SW sirve cache viejo instantáneamente y el chequeo arranca otra vez desde 0.

### 3. Cache HTTP del navegador (independiente del SW)
Aunque borres el SW, el navegador (Chrome/Safari móvil) cachea `index.html`, JS y CSS por su cuenta con headers default. Un "recargar" normal no limpia esto, necesitas hard refresh.

### Por qué "cerrar y abrir" no funciona
- **PWA instalada**: usa el SW → sirve cache → no chequea red al abrir.
- **Sitio web normal**: el navegador usa su cache HTTP → sirve archivos viejos.
- Tu botón `VersionFooter` SÍ limpia todo, pero requiere que entres y lo presiones.

---

## Solución: simplificar al máximo (nativo, sin SW agresivo)

### Opción recomendada: **Quitar el Service Worker, dejar solo "instalable"**

Tu app no necesita offline real (es de gestión de ganadería con datos en Supabase, requiere internet siempre). El SW solo te está causando problemas. Lovable docs lo dice explícitamente: si solo quieres "Add to Home Screen", **NO necesitas SW**.

### Cambios concretos

**1. `vite.config.ts`** — Reemplazar `VitePWA` plugin por nada. Mover el manifest a un archivo estático `public/manifest.webmanifest` (ya tienes `public/manifest.json`, solo lo referenciamos).

**2. `index.html`** — Asegurar que tenga:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#b79f60" />
```
Y meta tags para que el navegador NO cachee HTML:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

**3. `src/main.tsx`** — Cambiar el guard actual (que solo desregistra en preview) por **desregistrar SIEMPRE** los SW viejos que ya tengan tus usuarios instalados:
```ts
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  if ("caches" in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}
```
Esto **limpia automáticamente** el SW viejo de cualquier usuario que ya tenga la PWA instalada, en su próxima visita. Después de una visita, ya no tendrán cache persistente.

**4. Eliminar `src/components/PwaUpdatePrompt.tsx`** y su uso en `App.tsx` (ya no hay SW que actualizar).

**5. `package.json`** — Quitar dependencia `vite-plugin-pwa`.

**6. `VersionFooter.tsx`** — Simplificar: ya no necesita lógica de SW, solo `window.location.reload()` con cache-bust:
```ts
window.location.href = window.location.pathname + "?v=" + Date.now();
```

### Resultado

| Antes | Después |
|---|---|
| SW cachea todo, update tarda días | Sin SW, navegador siempre pide al servidor |
| Modal de update poco confiable | Cada recarga trae lo último automáticamente |
| Usuarios atrapados con versión vieja | El SW viejo se auto-desinstala en próxima visita |
| Instalable como PWA ✅ | Sigue siendo instalable como PWA ✅ |
| Funciona offline ✅ | No funciona offline ❌ (pero nunca lo usaste así) |

### Trade-off
Pierdes capacidad offline. Tu app **necesita internet** de todas formas para Supabase (login, datos de animales, fincas). No es una pérdida real.

### Migración limpia
Después del deploy, los usuarios que ya tienen la PWA instalada:
1. Abren la app → el nuevo `main.tsx` desregistra el SW viejo y limpia caches.
2. Recargan una vez (o cierran y abren) → ya tienen versión limpia sin SW.
3. De ahí en adelante, cada apertura trae lo más reciente del servidor.

### Archivos
| Archivo | Cambio |
|---|---|
| `vite.config.ts` | Quitar `VitePWA` plugin y su import |
| `index.html` | Añadir `<link rel="manifest">` y meta cache-control |
| `src/main.tsx` | Desregistrar SW siempre (no solo en preview) + limpiar caches |
| `src/App.tsx` | Quitar `<PwaUpdatePrompt />` y su import |
| `src/components/PwaUpdatePrompt.tsx` | Eliminar archivo |
| `src/components/VersionFooter.tsx` | Simplificar a reload con cache-bust |
| `package.json` | Quitar `vite-plugin-pwa` |

