

## Plan: Reemplazo de imágenes (assets estáticos)

### Archivos a copiar a `src/assets/menu-icons/`
| Origen (user-uploads) | Destino |
|---|---|
| `OPCION_MENU_FINCAS.webp` | `src/assets/menu-icons/fincas.webp` |
| `OPCION_MENU_HEMBRAS.webp` | `src/assets/menu-icons/hembras.webp` |
| `OPCION_MENU_CRIAS.webp` | `src/assets/menu-icons/crias.webp` |
| `OPCION_MENU_EMBRIONES.webp` | `src/assets/menu-icons/embriones.webp` |
| `OPCION_MENU_GENERALIDADES.webp` | `src/assets/menu-icons/generalidades.webp` |

**Nota Machos**: no se subió `OPCION_MENU_MACHOS.webp`. Por ahora dejo el círculo de Machos con el emoji 🐂 actual hasta que lo envíes.

### Archivos a copiar a `src/assets/`
| Origen | Destino | Uso |
|---|---|---|
| `banner_vista_menu.webp` | `src/assets/menu-header.webp` (reemplaza el `.jpg`) | Header de `/menu` |
| `banner_hembras.webp` | `src/assets/banner-hembras.webp` (nuevo) | Header solo de `/categoria/hembra` |

### Cambios de código

**1. `src/pages/Menu.tsx`**
- Importar las 5 imágenes nuevas de `menu-icons/`
- Cambiar el array `items`: reemplazar el campo `icon: "🏡" / "🐄" / "🐃" / "🥚"` y `solid: true` por `image: <importedAsset>` para FINCAS, HEMBRAS, CRÍAS, EMBRIONES, GENERALIDADES
- MACHOS conserva `icon: "🐂"` 
- Componente `CircleButton`: si el item tiene `image`, renderiza `<img>` cubriendo el círculo (`object-cover w-full h-full`). Si tiene `icon`, mantiene el emoji
- El círculo de GENERALIDADES deja de usar `bg-gold-solid + jps-logo`, ahora usa la imagen `generalidades.webp` con el mismo borde dorado que los demás
- Reemplazar `import menuHeader from "@/assets/menu-header.jpg"` → `"@/assets/menu-header.webp"` y borrar el `.jpg` viejo

**2. `src/pages/CategoriaAnimales.tsx`**
- Importar `bannerHembras` desde `@/assets/banner-hembras.webp`
- Importar `listaHeader` (sigue igual) como fallback
- Lógica: `const headerImg = validTipo === "hembra" ? bannerHembras : listaHeader;`
- Usar `headerImg` en el `<img>` del header

### Limpieza
- Borrar `src/assets/menu-header.jpg` (reemplazado por `.webp`)
- NO borrar `lista-header.jpg` (sigue usándose para machos/crías/embriones)
- NO tocar `jps-logo.webp` ni `jps-login-hero.png`

### Performance
- Todas las nuevas imágenes ya vienen en WebP optimizado del usuario
- Se importan como módulos ES6 → Vite las hashea y cachea permanentemente
- El header del menú lleva `loading="eager"` (above-the-fold), los íconos del grid pueden quedar igual (ya están en bundle)

### Próximo plan (no incluido aquí)
Sistema CMS de imágenes editables desde super_admin con tabla `site_images` + bucket + hook `useSiteImage` con fallback a estos assets.

