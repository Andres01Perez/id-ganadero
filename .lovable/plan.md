

## Ajustes de tipografía en arco del Menu

Comparando con la plantilla adjunta:
- El texto se ve **más grande** (≈14px vs 11px actual)
- Las letras están **más juntas** (letter-spacing ≈1px vs 2px actual)
- El arco tiene el **mismo ancho que el círculo** (96px), no más ancho

### Cambios en `src/pages/Menu.tsx` (CircleButton, líneas 38-50)

**SVG container**: cambiar de `w-28 h-8` (112px) a `w-24 h-9` (96px) para que coincida con el ancho del círculo (también `w-24`). Ajustar `viewBox` a `0 0 96 36`.

**Path del arco**: ajustar coordenadas para el nuevo viewBox — `M 6 32 A 42 42 0 0 1 90 32` (radio menor, curvatura suave que abraza el círculo).

**Estilos de texto**:
- `fontSize: 11` → `fontSize: 14`
- `letterSpacing: 2` → `letterSpacing: 1`
- Mantener `fontWeight: 700`

**Gap**: cambiar `gap-1` a `gap-0` o `-mb-1` para que el texto quede pegado al borde superior del círculo como en la plantilla.

### Resultado esperado
Texto en arco más prominente, letras compactas siguiendo la curva superior del círculo dorado, igual que la plantilla "FINCAS / MACHOS / HEMBRAS / CRIAS / EMBRIONES".

### Archivo
| Archivo | Cambio |
|---|---|
| `src/pages/Menu.tsx` | Ajustar dimensiones SVG, viewBox, path del arco, fontSize y letterSpacing |

