

## Plan: Ajustar layout y formato de imagen en Index.tsx

### Cambios en `src/pages/Index.tsx`:

1. **Imagen hero → `object-contain`** (línea 27): cambiar `object-cover` a `object-contain` para que la imagen se ajuste responsivamente sin recortarse

2. **Proporción 80%-20%**: cambiar las alturas del hero y la sección dorada:
   - Hero (sin input): `70dvh` → `80dvh`
   - Sección dorada (sin input): `30dvh` → `20dvh`
   - Con input: mantener `30dvh` / `70dvh` para que el teclado tenga espacio

3. **Botón centrado verticalmente** en la sección dorada: cambiar `justify-start` + `pt-12` a `justify-center` + quitar el `pt-12`, para que el botón quede centrado en el 20% dorado

