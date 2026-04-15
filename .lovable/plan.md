

## Plan: Reemplazar círculos del menú con imágenes personalizadas

Las 6 imágenes subidas ya incluyen el texto curvado y el círculo con borde dorado, así que el componente `CircleButton` con SVG se elimina por completo. Cada botón del menú será simplemente la imagen correspondiente.

### Archivos

**Copiar imágenes a `src/assets/menu/`:**
- `ID-GANADERO-fincas.png` → `src/assets/menu/fincas.png`
- `ID-GANADERO-machos.png` → `src/assets/menu/machos.png`
- `ID-GANADERO-hembras.png` → `src/assets/menu/hembras.png`
- `ID-GANADERO-crias.png` → `src/assets/menu/crias.png`
- `ID-GANADERO-embriones.png` → `src/assets/menu/embriones.png`
- `ID-GANADERO-generalidades.png` → `src/assets/menu/generalidades.png`

**`src/pages/Menu.tsx`:**
- Eliminar el componente `CircleButton` (SVG textPath, círculo con Unsplash placeholder)
- Importar las 6 imágenes desde `@/assets/menu/`
- Asociar cada imagen al ítem del menú (Fincas, Machos, Hembras, Crías, Embriones, Generalidades)
- Renderizar cada botón como un simple `<button>` con la `<img>` dentro, en el grid 2x3 existente
- Mantener el hero, el divisor dorado, el fondo blanco de la sección menú y el botón de cerrar sesión

