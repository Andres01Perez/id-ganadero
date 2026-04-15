

## Plan: Optimizar imágenes — Convertir PNG a WebP

### Diagnóstico
Las 6 imágenes del menú pesan ~5MB total (la más pesada: machos.png = 1.1MB). Esto causa carga lenta, especialmente en móviles con datos.

### Solución: Conversión a WebP
WebP reduce el tamaño ~70-80% sin pérdida visible de calidad. Las imágenes se convierten una vez y quedan estáticas en el proyecto.

**No usamos lazy loading** porque las 6 imágenes son visibles al mismo tiempo en la pantalla del menú — no hay beneficio en cargarlas diferidas.

### Implementación

1. **Convertir las 7 imágenes** (6 menú + hero) de PNG a WebP usando `cwebp` con calidad 80
2. **Actualizar imports en `Menu.tsx`** — cambiar `.png` → `.webp`
3. **Actualizar import en `Index.tsx`** — hero-logo `.png` → `.webp`
4. **Eliminar los PNG originales** para no duplicar peso

### Resultado esperado
- De ~5.5MB total a ~1-1.5MB total
- Carga notablemente más rápida en móvil
- Sin cambio visual perceptible

### Archivos a modificar
- `src/assets/menu/*.png` → convertir a `.webp` y eliminar PNG
- `src/assets/hero-logo.png` → convertir a `.webp` y eliminar PNG
- `src/pages/Menu.tsx` — actualizar imports
- `src/pages/Index.tsx` — actualizar import del hero

