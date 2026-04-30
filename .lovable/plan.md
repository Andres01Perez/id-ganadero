## Diagnóstico: por qué la PWA muestra la barra del navegador

Revisé `public/manifest.json`, `index.html` y `public/sw.js`. La configuración base está bien (`display: "standalone"`, manifest enlazado, service worker registrado, iconos 192/512 presentes, meta de iOS correctos). Pero hay tres puntos que explican el comportamiento que ves y que conviene corregir:

### 1. La instalación previa quedó "congelada" en modo navegador

Cuando una PWA ya está instalada en un dispositivo, **iOS y Android cachean los campos `display`, `start_url`, `scope` y `id` tal como estaban en el momento de instalar**. Cualquier cambio posterior al `manifest.json` **no se propaga** a la instalación existente. Solo se aplica si el usuario:

```text
1. Desinstala la app (mantener pulsado el ícono → eliminar/desinstalar).
2. Vuelve a abrir la web en el navegador.
3. La instala de nuevo desde el menú "Instalar app" / "Añadir a pantalla de inicio".
```

Esto es muy probablemente lo que te está pasando: la app se instaló cuando el manifest aún no tenía `display: "standalone"` correctamente, o se añadió como "acceso directo" del navegador (no como PWA real).

### 2. Falta `display_override` y `scope` (mejoras para nuevas instalaciones)

El manifest actual solo declara `display: "standalone"`. Para forzar que tanto Android como navegadores modernos respeten el modo sin barra, conviene añadir:

- `display_override: ["standalone", "fullscreen", "minimal-ui"]` — orden explícito de fallback.
- `scope: "/"` — define el ámbito de navegación; sin él algunos navegadores devuelven al modo browser cuando navegas fuera del `start_url`.
- `id: "/"` — ancla la identidad de la PWA para que futuras actualizaciones se apliquen como la misma app.
- `orientation: "portrait"` — coherente con app móvil.
- `lang` y `dir` — buena práctica.
- Marcar el icono 512 también como `"purpose": "any maskable"` para Android.

### 3. Falta el icono apple-touch-icon en tamaños grandes (iOS)

iOS usa `apple-touch-icon` (180×180) para decidir si tratar la página como app nativa al añadirla a inicio. Ya existe `/icons/apple-touch-icon.png`, pero conviene declarar el tamaño explícito en el `<link>` para que iOS lo respete sin ambigüedad.

---

## Cambios que se aplicarán

### A. `public/manifest.json` — versión robusta

```json
{
  "name": "JPS Ganadería",
  "short_name": "JPS",
  "description": "Control de ganadería JPS",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "display_override": ["standalone", "fullscreen", "minimal-ui"],
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#b79f60",
  "lang": "es",
  "dir": "ltr",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### B. `index.html` — refuerzo de meta tags iOS/Android

Añadir junto a los meta existentes:

```html
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="application-name" content="JPS Ganadería" />
<meta name="apple-mobile-web-app-title" content="JPS" />
```

(`apple-mobile-web-app-capable` ya está; agregamos `mobile-web-app-capable` que es el equivalente moderno para Chrome/Android.)

### C. Sin tocar `sw.js`, `vite.config.ts` ni el código React

El service worker actual ya cachea solo imágenes y la lógica de actualización funciona. No hace falta cambiarlo.

---

## Qué tendrás que hacer tú después de publicar

Esto es **clave**, porque sin esto los cambios no se verán en tu instalación actual:

```text
1. Publicar (botón Publish → Update).
2. En el dispositivo donde está instalada la PWA:
   a. Mantener pulsado el ícono de JPS Ganadería en la pantalla de inicio.
   b. Elegir "Eliminar app" / "Desinstalar".
3. Abrir https://idganadero.com en Chrome (Android) o Safari (iOS).
4. Reinstalar:
   - Android (Chrome): menú ⋮ → "Instalar app" o "Añadir a pantalla principal".
     IMPORTANTE: debe decir "Instalar app", no "Crear acceso directo".
   - iOS (Safari): botón compartir → "Añadir a pantalla de inicio".
5. Abrir la app desde el ícono del escritorio. Ya no debe aparecer la barra de URL.
```

Si en Android solo aparece "Crear acceso directo" y no "Instalar app", significa que el navegador no está reconociendo el manifest — en ese caso revisaríamos con DevTools → Application → Manifest cuál validación está fallando.

### Archivos que se tocarán

```text
public/manifest.json
index.html
```
