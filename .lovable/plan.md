

## Plan: Perfeccionar fuente, imágenes y textos

### Cambios

1. **Fuente Fira Sans Condensed**
   - Agregar los `<link>` de Google Fonts en `index.html`
   - Agregar `font-family: 'Fira Sans Condensed', sans-serif` al `body` en `src/index.css`

2. **Imagen de inicio (BPP)**
   - Copiar `user-uploads://ID_GANADERO-11_BPP.webp` a `src/assets/hero-bpp.webp`
   - En `Index.tsx`: reemplazar el import de `hero-logo.webp` por `hero-bpp.webp`
   - Cambiar `object-contain` a `object-cover` para que la imagen llene el hero

3. **Imágenes del menú**
   - Copiar las 6 imágenes webp subidas a `src/assets/menu/` (reemplazando las actuales):
     - `ID_GANADERO-02_FINCAS.webp` → `fincas.webp`
     - `ID_GANADERO-03_MACHOS.webp` → `machos.webp`
     - `ID_GANADERO-04_HEMBRAS.webp` → `hembras.webp`
     - `ID_GANADERO-05_CRIAS.webp` → `crias.webp`
     - `ID_GANADERO-08_EMBRIONES.webp` → `embriones.webp`
     - `ID_GANADERO-07_GENERALIDADES.webp` → `generalidades.webp`

4. **Texto de etiquetas en el menú**
   - Agregar debajo de cada imagen del menú un `<span>` con el nombre (Fincas, Machos, Hembras, Crías, Embriones, Generalidades) en Fira Sans Condensed, bold, color dorado (`#b79f60`), centrado

### Archivos a modificar/crear
- `index.html` — agregar Google Fonts links
- `src/index.css` — aplicar font-family global
- `src/pages/Index.tsx` — nueva imagen hero
- `src/pages/Menu.tsx` — agregar labels de texto bajo cada imagen
- `src/assets/hero-bpp.webp` — nueva imagen
- `src/assets/menu/*.webp` — 6 imágenes reemplazadas

