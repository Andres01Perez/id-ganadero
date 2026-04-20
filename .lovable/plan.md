

## Añadir banners editables a las vistas de categorías de animales

### Contexto
Las vistas `/machos`, `/hembras`, `/crias`, `/embriones` son todas instancias de `CategoriaAnimales.tsx` con un banner header. Hoy ese banner usa una imagen fija. Hay que permitir reemplazarlo desde `/superadmin/imagenes` con el mismo flujo (drag&drop + recorte).

### Cambios

**1. `src/lib/asset-keys.ts`**
Añadir 4 claves nuevas + sus fallbacks (usando el `menuHeader` actual como placeholder hasta que el superadmin suba uno propio):
```ts
ASSET_KEYS.bannerMachos    = "categoria.banner.machos"
ASSET_KEYS.bannerHembras   = "categoria.banner.hembras"
ASSET_KEYS.bannerCrias     = "categoria.banner.crias"
ASSET_KEYS.bannerEmbriones = "categoria.banner.embriones"
```
Cada uno mapeado en `ASSET_FALLBACKS` al banner estático que hoy se vea en esa vista (revisar qué imagen usa `CategoriaAnimales` y reusarla; si comparten `menuHeader`, ese es el fallback).

**2. `src/pages/CategoriaAnimales.tsx`**
- Determinar la `tipo` (machos/hembras/crias/embriones) que ya recibe por ruta o prop.
- Mapa `tipo → assetKey` y `tipo → fallback`.
- Sustituir el `<img src={bannerEstatico} />` por `<img src={useAppAsset(assetKey, fallback)} />`.

**3. `src/pages/SuperAdmin/Imagenes.tsx`**
- Nueva pestaña **"Banners de categorías"** (o añadir al tab existente "Marca · Banners" como sub-grupo).
- 4 tarjetas `AssetDropzone`, una por categoría, todas con el mismo aspect ratio que el banner del menú (`865:503`, output `1600×930`) para mantener consistencia visual.
```ts
const categoryBanners: AssetItem[] = [
  { key: ASSET_KEYS.bannerMachos,    label: "Banner · Machos",    ...BANNER },
  { key: ASSET_KEYS.bannerHembras,   label: "Banner · Hembras",   ...BANNER },
  { key: ASSET_KEYS.bannerCrias,     label: "Banner · Crías",     ...BANNER },
  { key: ASSET_KEYS.bannerEmbriones, label: "Banner · Embriones", ...BANNER },
];
```

### Decisión de UI
Mantener tres tabs: **Menú principal · Marca y banners · Fotos de fincas**. Los 4 nuevos banners van dentro de "Marca y banners" como un segundo grupo bajo un sub-título "Banners de categorías", para no inflar la barra de tabs.

### Sin cambios necesarios
- BD, RLS, Storage, edge functions: nada. La tabla `app_assets` ya soporta cualquier `key` arbitraria.
- El flujo de subida + recorte + invalidación de cache ya funciona con `AssetDropzone`.

### Cómo verificar
1. Ir a `/superadmin/imagenes` → tab "Marca y banners" → ver las 4 tarjetas nuevas bajo "Banners de categorías".
2. Subir una imagen al banner de Machos → recortar 865:503 → confirmar.
3. Navegar a `/machos` → el banner debe mostrar la nueva imagen sin distorsión.
4. Repetir para `/hembras`, `/crias`, `/embriones`.
5. Restaurar uno con el botón "Restaurar" → la vista vuelve al fallback original.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/asset-keys.ts` | +4 claves y +4 fallbacks |
| `src/pages/CategoriaAnimales.tsx` | Banner dinámico vía `useAppAsset` según tipo |
| `src/pages/SuperAdmin/Imagenes.tsx` | Nuevo grupo "Banners de categorías" en el tab Marca |

