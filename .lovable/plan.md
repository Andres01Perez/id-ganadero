## Objetivo
Permitir cambiar desde `/superadmin/imagenes` el banner de la página `/finca/:id/menu-finca` (banner global usado como fallback cuando la finca no tiene foto propia). El banner de `/fincas` ya existe y se deja tal cual.

## Cambios

### 1. Nueva clave de asset
En `src/lib/asset-keys.ts`:
- Añadir `bannerMenuFinca: "categoria.banner.menu_finca"` a `ASSET_KEYS`.
- Añadir su fallback en `ASSET_FALLBACKS` (reutilizar `listaHeader` o el mismo `bannerFincas`).

### 2. Panel Superadmin
En `src/pages/SuperAdmin/Imagenes.tsx`, dentro de `categoryBanners`, agregar:
- `{ key: ASSET_KEYS.bannerMenuFinca, label: "Banner · Menú de finca", ...BANNER }`

Así aparece junto a los otros banners con el mismo crop 865/503 que ya usan las cabeceras.

### 3. Uso en `/finca/:id/menu-finca`
En `src/pages/MenuFinca.tsx` cambiar la línea del fallback:
- `const fallbackBanner = useAppAsset(ASSET_KEYS.bannerMenuFinca, ASSET_FALLBACKS[ASSET_KEYS.bannerMenuFinca]);`
- Mantener `fincaActiva?.foto_url || fallbackBanner` para que la foto de la finca siga teniendo prioridad.

### 4. Texto descriptivo
Actualizar la descripción de la sección "Banners de categorías" para mencionar también `/finca/:id/menu-finca`.

## Verificación
- Entrar a `/superadmin/imagenes` → pestaña "Marca · Banners" → ver dos tarjetas nuevas/existentes: "Banner · Fincas" y "Banner · Menú de finca".
- Subir imagen al "Banner · Menú de finca" y abrir una finca **sin foto propia** → debe mostrarse la imagen subida.
- Abrir una finca **con foto propia** → sigue mostrando la foto de la finca (prioridad).

## Notas técnicas
No se requieren migraciones de base de datos ni cambios de RLS: `app_assets` ya soporta cualquier clave nueva con las políticas existentes para super_admin.