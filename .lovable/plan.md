
## Garantía sobre versionado y PWA

Los cambios propuestos **no tocan**:

- `public/sw.js` (Service Worker) — sigue igual: cache-first para imágenes, SWR para `/app-assets/`, **nunca** cachea HTML/JS/CSS.
- `useAppUpdate.tsx` — sigue detectando nuevas versiones comparando el hash del bundle contra el `index.html` del servidor.
- `vite.config.ts` (`__APP_VERSION__`, `__APP_BUILD_ID__`) — sin cambios.
- `VersionFooter.tsx` ni el flujo de "hard reload" / "limpiar caché".
- Registro/desregistro del SW en `main.tsx`.

Solo se modifica **lógica de React Query + localStorage** para la URL del asset. Cuando subas una nueva versión de la app, el bundle hasheado cambiará igual que hoy y el toast "Nueva versión disponible" seguirá apareciendo. Cuando subas una nueva imagen desde Superadmin, el SW (SWR) y `refetchOnWindowFocus` la recogerán igual que hoy.

---

## Problema

Al entrar a `/menu`, `/categoria/:tipo`, `/fincas`, etc., se ve por ~200 ms la imagen **bundleada** (fallback estático importado), y luego salta a la imagen real de Supabase. Causa:

`useAppAsset` retorna `data ?? synced ?? fallback`. En frío (sin localStorage), `data` está `undefined` mientras carga la query → renderiza `fallback` (asset bundleado viejo) → cuando llega la query, salta a la URL real.

`useAllAppAssets()` solo se ejecuta en el panel Superadmin, así que el usuario normal nunca tiene el localStorage precalentado en la primera sesión.

## Solución

### 1. Bootstrap de assets al iniciar sesión

Nuevo hook `useAppAssetsBootstrap()` en `src/hooks/useAppAsset.ts`:
- Hace UN solo `select key, url from app_assets` apenas hay sesión autenticada.
- Escribe el snapshot completo en `localStorage` (`jps_assets_v1`).
- Pre-popula la cache de React Query con `queryClient.setQueryData(["app_asset", key], url)` para cada fila.
- `staleTime: 5 min`, `refetchOnWindowFocus: true` → si el superadmin sube una imagen nueva, al volver a la pestaña se refresca.

Se llama una vez dentro de `AuthProvider` cuando hay `session`.

### 2. Ajustar `useAppAsset` para no flashear el fallback

- `initialData` lee de localStorage (ya lo hace, se mantiene).
- `staleTime: 5 * 60 * 1000` y `refetchOnMount: false` cuando ya hay `initialData` (evita refetch agresivo en cada navegación).
- `refetchOnWindowFocus: true` se mantiene.
- El fallback bundleado solo se usa si **no hay nada** en localStorage **ni** en la cache de React Query (cold start absoluto, primera vez de la primera sesión antes de que termine el bootstrap).

### 3. Sin cambios en páginas

`Menu.tsx`, `CategoriaAnimales.tsx`, `Fincas.tsx`, `Imagenes.tsx` siguen usando `useAppAsset(key, fallback)` igual.

## Archivos a modificar

- `src/hooks/useAppAsset.ts` — añadir `useAppAssetsBootstrap()`, ajustar opciones de la query.
- `src/hooks/useAuth.tsx` — invocar `useAppAssetsBootstrap()` cuando hay sesión.

## Resultado esperado

- **Primera carga (sesión nueva)**: bootstrap corre en paralelo al primer render. La primera vista puede mostrar fallback ~100 ms, pero al navegar a otras pantallas dentro de la sesión ya no hay flash.
- **Navegaciones siguientes**: instantáneo desde localStorage, sin flash, sin refetch.
- **Sesiones posteriores (mismo navegador)**: instantáneo desde el primer render porque localStorage persiste.
- **Cambio de imagen desde Superadmin**: al volver a la pestaña se invalida y se ve la nueva (igual que hoy, vía SWR del SW + `refetchOnWindowFocus`).
- **Nueva versión de la app**: detección y reload siguen funcionando exactamente igual (no se toca `useAppUpdate` ni el SW).
