

## Mejoras visuales: login alto + safe-area top

### 1. Modal de login al estilo CRUDs internos

**Estado actual** (`src/pages/Index.tsx`):
```
<SheetContent side="bottom" className="bg-black border-t-2 border-gold rounded-t-3xl p-6 pb-10 max-h-[80vh]">
```
El `max-h-[80vh]` solo limita el alto máximo, pero como el contenido es corto el sheet se queda abajo y mide ~30-40% de pantalla. No "sube" hasta arriba.

**Estado de los CRUDs** (`AnimalForm`, `FincaForm`):
```
<SheetContent side="bottom" className="h-[92dvh] overflow-y-auto rounded-t-2xl">
```
Usan `h-[92dvh]` (alto fijo, casi pantalla completa) → el sheet sube hasta arriba.

**Cambio propuesto** en `src/pages/Index.tsx`:
- Cambiar `max-h-[80vh]` → `h-[70dvh]` (el usuario pidió 70%, que coincide con el patrón).
- Agregar `overflow-y-auto` por seguridad.
- Mantener el resto: fondo negro, borde dorado, `rounded-t-3xl`, tipografía.
- Centrar verticalmente el contenido dentro del sheet con `flex flex-col justify-center` para que con tanto alto el formulario no quede pegado arriba sino visualmente equilibrado.

Resultado: el modal de login arranca a ~30% del top, se siente premium y consistente con el resto de la app.

### 2. Safe area superior (que el contenido no quede bajo la hora/notch)

**Causa raíz**: 
- `index.html` tiene `viewport-fit=cover` y `apple-mobile-web-app-status-bar-style="black-translucent"` → en iOS standalone (PWA instalada), el contenido se renderiza **detrás** de la barra de estado.
- Las páginas no aplican `padding-top: env(safe-area-inset-top)`, así que headers, botones de back y títulos quedan tapados por la hora/notch.

**Solución**: añadir padding superior con safe area en los headers de cada vista. Dos enfoques posibles, propongo el más limpio:

#### A. Utility global en `src/index.css`
Agregar una utility reusable:
```css
@layer utilities {
  .pt-safe { padding-top: env(safe-area-inset-top); }
  .pt-safe-plus { padding-top: calc(env(safe-area-inset-top) + 0.5rem); }
}
```

#### B. Aplicarla en los puntos correctos

| Archivo | Cambio |
|---|---|
| `src/pages/Menu.tsx` | `<header className="relative h-44 ...">` → añadir `pt-safe` al header. El botón de logout `top-3` → `top-[calc(env(safe-area-inset-top)+0.75rem)]`. |
| `src/pages/CategoriaAnimales.tsx` | Header de la lista: añadir `pt-safe` al wrapper del header (back + título). |
| `src/pages/Fincas.tsx` | Mismo: `pt-safe` en el header. |
| `src/pages/HojaVidaAnimal.tsx` | Mismo: `pt-safe` en la barra superior con el back. |
| `src/pages/Admin.tsx` | Mismo en el header. |
| `src/pages/Index.tsx` (login) | Hero a pantalla completa: el contenido visible (logo de la vaca) está bien al edge, pero conviene NO aplicarlo para mantener el look fullbleed. Sin cambios aquí. |
| `src/pages/PlaceholderPage.tsx` | Añadir `pt-safe` al header. |
| `src/pages/NotFound.tsx` | Añadir `pt-safe`. |

**Por qué no tocar `<body>` global**: rompe el hero fullbleed del login y obliga a recalcular alturas en muchos sitios. Aplicar por header es más quirúrgico y predecible.

**Bottom**: ya está manejado en `Menu.tsx` con `pb-[env(safe-area-inset-bottom)]`. Verifico que `BottomTabBar` también lo respete agregando `pb-[env(safe-area-inset-bottom)]` al `<nav>` cuando es `fixed` — pequeño ajuste de paridad.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/Index.tsx` | `max-h-[80vh]` → `h-[70dvh]` + `overflow-y-auto` + `flex flex-col justify-center` interno |
| `src/index.css` | Añadir utilities `.pt-safe` y `.pt-safe-plus` |
| `src/pages/Menu.tsx` | `pt-safe` en header, ajustar `top` del botón logout |
| `src/pages/CategoriaAnimales.tsx` | `pt-safe` en header |
| `src/pages/Fincas.tsx` | `pt-safe` en header |
| `src/pages/HojaVidaAnimal.tsx` | `pt-safe` en barra superior |
| `src/pages/Admin.tsx` | `pt-safe` en header |
| `src/pages/PlaceholderPage.tsx` | `pt-safe` en header |
| `src/pages/NotFound.tsx` | `pt-safe` en wrapper |
| `src/components/BottomTabBar.tsx` | `pb-[env(safe-area-inset-bottom)]` al nav cuando `fixed` |

### Notas técnicas

- `env(safe-area-inset-top)` solo tiene valor real en iOS PWA standalone con notch. En navegadores normales devuelve 0, así que no afecta visualmente en escritorio ni Android sin notch.
- `100dvh` ya se usa en varias vistas (`min-h-[100dvh]`) — es la unidad correcta para mobile, sigue siendo coherente.
- El sheet de login con `h-[70dvh]` deja el 30% superior con el hero de la vaca visible, lo cual mantiene el branding mientras se interactúa con el form.

