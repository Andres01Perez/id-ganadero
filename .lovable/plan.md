

## Mostrar versión real del build en el footer

### Problema
- `package.json` tiene `version: "0.1.0"` fija → footer siempre muestra `v0.1.0`.
- `git rev-parse` en `vite.config.ts` falla en el entorno de build de Lovable → commit siempre es `"local"` en producción.
- Resultado: el footer no refleja que hubo un nuevo deploy, aunque el bundle JS sí cambie.

### Solución: usar timestamp de build + hash del bundle como "versión visible"

En lugar de depender de `package.json` y `git` (que no funcionan en Lovable build), usar dos cosas que SÍ están disponibles en build time y cambian con cada deploy:

1. **`__APP_BUILD_DATE__`** (ya existe en `vite.config.ts`): se genera con `new Date().toISOString()` cada build → único por deploy.
2. **Hash del bundle JS** (lo genera Vite automáticamente y queda en el filename `index-XXXXXXXX.js`): cambia solo cuando el código cambia → identificador real del deploy.

### Cambios

**1. `vite.config.ts`** — generar un identificador corto de build determinista:
```ts
// Build ID corto: YYMMDD-HHMM (UTC) → ej. "260420-1843"
const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const APP_BUILD_ID = `${String(now.getUTCFullYear()).slice(2)}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;

// Mantener APP_VERSION desde package.json
// Eliminar APP_COMMIT (no funciona en Lovable build)
// Añadir APP_BUILD_ID como reemplazo
```

Y exponer:
```ts
define: {
  __APP_VERSION__: JSON.stringify(APP_VERSION),
  __APP_BUILD_ID__: JSON.stringify(APP_BUILD_ID),
  __APP_BUILD_DATE__: JSON.stringify(APP_BUILD_DATE),
},
```

**2. `src/vite-env.d.ts`** — declarar `__APP_BUILD_ID__`, eliminar `__APP_COMMIT__`.

**3. `src/components/VersionFooter.tsx`** — mostrar `v{version} · {buildId}`:
```tsx
const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
const buildId = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "dev";
// ...
<span>v{version} · {buildId}</span>
```

Resultado visible en el celular: `v0.1.0 · 260420-1843` → la parte `260420-1843` cambia con cada deploy de Lovable, así sabes con certeza si la PWA actualizó.

**4. (Opcional pero recomendado) `useAppUpdate.tsx`** — hoy compara el hash del bundle JS contra `index.html`. Eso ya funciona y no necesita cambio. El nuevo `buildId` es solo para que el usuario VEA que cambió.

### Por qué no usar git commit
- `git` no está disponible en el sandbox de build de Lovable → siempre cae a `"local"`.
- Sería confuso seguir mostrándolo. Mejor reemplazarlo por algo que sí cambia.

### Por qué no incrementar `package.json` automáticamente
- Lovable no ejecuta `npm version` ni hooks de pre-build.
- Tendrías que recordar bumpearlo manualmente cada vez → fricción innecesaria.
- El `buildId` por timestamp es automático y suficiente para verificar deploys.

### Cómo verificar después de implementar
1. Publicar con el botón de Lovable.
2. Abrir la PWA en el celular, esperar el toast "Nueva versión disponible", actualizar.
3. Mirar el footer: ahora debe decir algo tipo `v0.1.0 · 260420-1843` con un timestamp reciente.
4. Publicar otra vez sin cambiar nada → el `buildId` cambia (nuevo timestamp) → confirmas que el deploy entró.

### Archivos a modificar
- `vite.config.ts`
- `src/vite-env.d.ts`
- `src/components/VersionFooter.tsx`

### Fuera de alcance
- Bumpeo automático de `package.json` en cada deploy (requeriría infra que Lovable no expone).
- Mostrar el hash del bundle JS — ya está implícito en la URL del script, no aporta más que el timestamp.

