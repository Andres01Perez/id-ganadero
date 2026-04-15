

## Plan: Actualizar Vista Menú + Convertir a PWA

### 1. Menú — Cambios de diseño

**Archivo: `src/pages/Menu.tsx`**
- Agregar "Fincas" como primer ítem en `menuItems` (ruta `/fincas`)
- Dividir visualmente hero y menú con una línea divisora color `#b79f60`
- Cambiar el fondo de la sección del menú a **blanco**
- Con 6 ítems, el grid 2x3 queda simétrico (3 filas, 2 columnas) — eliminar el caso especial del último ítem centrado
- Cambiar color del texto curvado SVG a negro o dorado oscuro para contraste con fondo blanco
- Cambiar texto "Cerrar sesión" a color oscuro para visibilidad

**Archivo: `src/App.tsx`**
- Agregar ruta `/fincas` con PlaceholderPage

### 2. PWA — Instalable desde el navegador

Dado que no necesitas soporte offline complejo, usaremos el enfoque simple: un `manifest.json` + meta tags, sin service worker ni `vite-plugin-pwa`. Esto permite instalar la app desde el navegador ("Agregar a pantalla de inicio").

**Archivo: `public/manifest.json`**
- Crear manifest con nombre "JPS Ganadería", colores del tema (#0a0a0a fondo, #b79f60 tema), `display: "standalone"`, iconos placeholder

**Archivo: `index.html`**
- Agregar `<link rel="manifest">`, meta tags para mobile (`theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, viewport)

**Archivo: `public/icons/`**
- Crear iconos PWA básicos (192x192, 512x512) — por ahora placeholders que podrás reemplazar con el logo real

### Archivos a crear/modificar
- `src/pages/Menu.tsx` — nuevo ítem Fincas, divisor dorado, fondo blanco sección menú
- `src/App.tsx` — ruta `/fincas`
- `public/manifest.json` — nuevo
- `index.html` — meta tags PWA

