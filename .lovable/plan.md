

## Plan: Cambiar imagen hero del menú

### Cambios

1. **Copiar imagen** — `user-uploads://ID_GANADERO-09_MENU_PPAL.webp` → `src/assets/hero-menu.webp`

2. **Actualizar `src/pages/Menu.tsx`**:
   - Línea 2: cambiar import de `hero-logo.webp` a `hero-menu.webp`
   - Línea 29: la imagen ya tiene `object-contain` (formato "contener"), se mantiene así — esto asegura que la imagen se ajuste responsivamente sin recortarse

