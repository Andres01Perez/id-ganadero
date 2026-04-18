

## Eliminar espacio del SVG entre texto y círculo

### Causa
El SVG tiene `viewBox="0 0 96 36"` (alto 36) pero el texto del arco se renderiza cerca de y=32. Eso deja ~22px de espacio vacío arriba del texto dentro del SVG, que empuja el círculo hacia abajo. El `-mb-1` (4px) actual no compensa esos ~22px.

### Solución en `src/pages/Menu.tsx` (líneas 38-50)

**Reducir altura del SVG al mínimo necesario para el texto**:
- `viewBox`: `0 0 96 36` → `0 0 96 18`
- Path: `M 6 32 A 42 42 0 0 1 90 32` → `M 6 14 A 42 42 0 0 1 90 14` (mover el arco hacia arriba dentro del nuevo viewBox)
- Container: `w-24 h-9` → `w-24 h-[18px]`
- Quitar `-mb-1` (ya no hace falta)

Con esto el SVG ocupa solo el alto del texto, y el círculo queda pegado debajo como en la plantilla.

### Archivo
| Archivo | Cambio |
|---|---|
| `src/pages/Menu.tsx` | Reducir alto del SVG y reposicionar el arco |

