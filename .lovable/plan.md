

## Plan: Actualizar Vista 1 y crear Vista 2 (Menú)

### Vista 1 — Cambios
1. **Reemplazar imagen hero** — Copiar `image-2.png` a `src/assets/hero-logo.png` (la imagen del toro con logo JPS)
2. **Cambiar colores del botón e input** — Fondo blanco (`#FFFFFF`) y texto negro para:
   - Botón "Iniciar Sesión"
   - Input de cédula
   - Botón flecha (→)

### Vista 2 — Menú con diseño circular
1. **Hero superior** con imagen destacada (reutilizar la imagen del toro o una sección de ella)
2. **Botones circulares** con:
   - Imagen de vaca dentro del círculo (usaremos placeholder images por ahora)
   - Texto curvado en la parte superior del círculo usando SVG `<textPath>` para el efecto de texto arqueado
   - 5 categorías: Machos, Hembras, Crías, Embriones, Generalidades
3. **Layout**: Scroll vertical con los círculos distribuidos en grid
4. Botón de cerrar sesión al final

### Archivos a modificar
- `src/assets/hero-logo.png` — reemplazar con `image-2.png`
- `src/pages/Index.tsx` — cambiar colores botón/input a blanco/negro
- `src/pages/Menu.tsx` — rediseñar con hero + círculos con texto curvado SVG

