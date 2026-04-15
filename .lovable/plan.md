

## Plan: PWA completa + Animación del input de cédula

### Problema 1: PWA no instalable
El `index.html` publicado **no tiene** `<link rel="manifest">` ni meta tags de Apple. El `manifest.json` existe pero no está enlazado. Además, para PWA completa con actualizaciones automáticas se necesita un service worker.

### Problema 2: Input detrás del teclado
La pantalla es `100dvh` fija. Al mostrar el input en el 30% inferior, el teclado del iPhone lo cubre completamente.

---

### 1. PWA completa con `vite-plugin-pwa`

**Instalar**: `vite-plugin-pwa`

**`vite.config.ts`** — Agregar VitePWA:
- `registerType: "autoUpdate"` — actualiza automáticamente cuando publiques cambios
- `devOptions: { enabled: false }` — no interferir en desarrollo
- `navigateFallbackDenylist: [/^\/~oauth/]`
- Manifest inline con nombre "JPS Ganadería", colores, iconos existentes
- Workbox con cache de assets estáticos

**`src/main.tsx`** — Agregar guard contra iframes/preview:
- Detectar si está en iframe o en host de preview de Lovable
- Si es preview: desregistrar service workers existentes
- Si es producción: permitir registro normal

**`index.html`** — Agregar meta tags de Apple:
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<meta name="theme-color" content="#0a0a0a">`
- `<link rel="apple-touch-icon" href="/icons/icon-192.png">`
- Quitar el `<link rel="manifest">` manual (VitePWA lo inyecta)

### 2. Animación del input de cédula

**`src/pages/Index.tsx`** — Cuando se muestra el input:
- Cambiar el layout de 70/30 fijo a una animación donde el hero se reduce y el input sube al centro de la pantalla, quedando visible por encima del teclado
- Usar transición CSS: el hero pasa de `70dvh` a `30dvh` y la sección inferior pasa de `30dvh` a `70dvh` con `transition-all duration-500`
- El input queda centrado en la parte superior de la sección dorada, lejos del teclado

### 3. Limpiar `App.css`
- Eliminar los estilos default de Vite que no se usan (`.logo`, `.card`, etc.)

### Archivos a modificar/crear
- `vite.config.ts` — agregar VitePWA plugin
- `src/main.tsx` — guard de service worker para preview
- `index.html` — meta tags Apple PWA
- `src/pages/Index.tsx` — animación del input
- `src/App.css` — limpiar estilos no usados
- `package.json` — nueva dependencia `vite-plugin-pwa`

