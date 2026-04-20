

## Eliminar flash de imagen y propagar cambios al instante

### Problema 1: Flash de imagen antigua → nueva

`useAppAsset` devuelve el `fallback` estático (importado del bundle) mientras carga la URL personalizada desde `app_assets`. Cuando llega la respuesta, la `<img>` cambia su `src` y se ve un flash. Esto ocurre en cada navegación a `/menu`, `/categoria/:tipo`, login, etc.

**Solución:** persistir la respuesta de `app_assets` en `localStorage` para que en la siguiente carga la URL personalizada esté disponible **sincrónicamente**, antes del primer render. Si no hay nada en localStorage (primer uso), se usa el fallback como hoy.

### Problema 2: Cambios no se ven en otros dispositivos sin recargar / publicar

La buena noticia: **no necesitas publicar en Lovable** para que se propaguen. Las imágenes viven en Supabase Storage + tabla `app_assets`, no en el código del bundle. Pero hay 3 capas de caché que retrasan la visibilidad:

| Capa | Hoy | Cambio |
|---|---|---|
| React Query (`useAppAsset`) | `staleTime: 5min` → durante 5 min sigue mostrando lo cacheado | Reducir a `staleTime: 0` + `refetchOnWindowFocus: true` para que cuando un usuario vuelva a la app vea cambios al instante |
| Service Worker (`public/sw.js`) | Cache-first eterno para imágenes | Para URLs de `app-assets` bucket, usar **stale-while-revalidate**: devuelve la cacheada al instante (sin flash) y en paralelo descarga la nueva para la próxima carga |
| URL del archivo | Cada subida usa `${Date.now()}.jpg` (URL nueva) | Sin cambios — ya funciona |

Combinado con el localStorage del Problema 1, el flujo final queda:
- Usuario A sube imagen nueva → URL en `app_assets` se actualiza.
- Usuario B abre la app → React Query refetcha en background al volver al foco → detecta nueva URL → la guarda en localStorage → siguiente apertura ya carga directo sin flash.

### Cambios concretos

**1. `src/hooks/useAppAsset.ts`**
- Mantener cache de URLs en `localStorage` bajo clave `jps_assets_v1` (objeto `{ key: url }`).
- En `useAppAsset(key, fallback)`: leer del localStorage **sincrónicamente** con `useState(() => localStorage[key] ?? fallback)`. Devolver eso como `initialData` a React Query → no hay flash.
- Cuando la query resuelve con una URL distinta, actualizar localStorage y el estado.
- `staleTime: 0`, `refetchOnWindowFocus: true`, `refetchOnMount: true`.
- En `useAllAppAssets`, al recibir datos, sincronizar el `localStorage` con el snapshot completo.

**2. `public/sw.js`**
- Para requests del bucket `app-assets` (detectado por `url.pathname.includes('/app-assets/')`): pasar a estrategia **stale-while-revalidate**:
  - Devolver inmediatamente lo cacheado si existe.
  - En paralelo, hacer fetch a red y actualizar el cache (sin bloquear al usuario).
- Para el resto de imágenes (`animal-fotos`, etc.): mantener cache-first como hoy.
- Bump versión cache: `IMG_CACHE = 'jps-images-v2'` para que se purgue la v1 vieja con archivos huérfanos.

**3. `src/components/AssetDropzone.tsx` (uploadBlob)**
- Después de hacer `upsert` exitoso en `app_assets`, también escribir en `localStorage[key] = newUrl` para que el propio superadmin no vea flash en otras pestañas.
- Enviar mensaje `{ type: 'PURGE_ASSET', url: oldUrl }` al Service Worker para que borre la entrada vieja del cache (opcional: limpia espacio).

**4. `public/sw.js` — handler de mensajes**
- Añadir handler para `PURGE_ASSET` que reciba una URL específica y la borre del cache.

### Sobre el storage de archivos antiguos
Cada subida deja el archivo anterior huérfano en Storage (porque la nueva usa otro `Date.now()`). Esto **no causa el flash** y no afecta funcionamiento, solo ocupa espacio. Limpiarlo no es trivial sin trackear historial. Lo dejo fuera de este plan; si lo quieres después, se puede hacer un edge function que elimine archivos viejos de cada `key` cuando se sube uno nuevo.

### Cómo verificar
1. Abrir `/menu` → recargar 5 veces → no debe haber flash de imagen vieja a nueva.
2. Desde otro dispositivo (o ventana de incógnito) entrar como superadmin → cambiar el banner del menú.
3. Volver al primer dispositivo, cambiar de pestaña y volver → toast no aparece (no es bundle nuevo) pero al refrescar `/menu` se debe ver la nueva imagen sin necesidad de publicar nada en Lovable.
4. Subir una imagen y abrirla en `/menu` desde el mismo navegador → la imagen aparece directamente sin pasar por la vieja.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/hooks/useAppAsset.ts` | localStorage como `initialData`, `staleTime: 0`, refetch on focus |
| `src/components/AssetDropzone.tsx` | Escribir nueva URL en localStorage tras upload + mensaje al SW |
| `public/sw.js` | Stale-while-revalidate para `/app-assets/`, bump cache name a v2, handler `PURGE_ASSET` |

