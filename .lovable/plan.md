

## Agregar banner editable de "Fincas" al panel de imágenes

### Contexto

En `/superadmin/imagenes`, dentro de la pestaña **Marca · Banners → Banners de categorías**, ya existen banners editables para Machos, Hembras, Crías y Embriones. Falta el banner de la pantalla **Fincas** (`/fincas`), que hoy usa una imagen estática (`lista-header.jpg`) sin posibilidad de cambio desde el superadmin.

### Cambios

**1. `src/lib/asset-keys.ts`**

Agregar la nueva clave canónica del banner de fincas y su fallback:

```text
bannerFincas: "categoria.banner.fincas"
```

Fallback: la misma imagen actual (`lista-header.jpg`) para no romper nada existente.

**2. `src/pages/SuperAdmin/Imagenes.tsx`**

Añadir una nueva entrada al arreglo `categoryBanners` para que aparezca como tarjeta editable junto a los demás banners de categorías:

```text
{ key: ASSET_KEYS.bannerFincas, label: "Banner · Fincas", ...BANNER }
```

También actualizar el subtítulo de "Banners de categorías" para mencionar `/fincas`.

**3. `src/pages/Fincas.tsx`**

Reemplazar el `<img src={listaHeader} ... />` estático por un consumo dinámico vía `useAppAsset`:

```text
const headerImg = useAppAsset(ASSET_KEYS.bannerFincas, ASSET_FALLBACKS[ASSET_KEYS.bannerFincas]);
```

Y usar `headerImg` como `src`. Esto sigue el mismo patrón ya implementado en `CategoriaAnimales.tsx`.

### Sin cambios en

- Base de datos (la tabla `app_assets` ya soporta cualquier clave nueva).
- Storage (el bucket `app-assets` y sus políticas son agnósticos a la clave).
- `useAppAsset.ts` (es genérico).

### Resultado

```text
1. En /superadmin/imagenes → "Marca · Banners" → "Banners de categorías"
   aparecerá una nueva tarjeta "Banner · Fincas".
2. El superadmin podrá subir/recortar la imagen con el mismo flujo (16:10).
3. El cambio se reflejará al instante en la pantalla /fincas.
4. Si nunca se sube nada, sigue mostrando la imagen original.
```

### Archivos que se tocarán

```text
src/lib/asset-keys.ts
src/pages/SuperAdmin/Imagenes.tsx
src/pages/Fincas.tsx
```

