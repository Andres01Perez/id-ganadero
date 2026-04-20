

## Empujar el contenido debajo del safe-area superior en mobile

### Problema
`SafeAreaTopBar` es una barra negra `fixed top-0` con altura `env(safe-area-inset-top)` y `z-50`. Como es `fixed`, no ocupa espacio en el flujo, así que las páginas mobile arrancan en `top: 0` y la barra negra tapa los primeros píxeles de cada vista. Resultado: la imagen del header queda recortada y el botón de volver / cerrar sesión queda detrás de la barra negra.

### Solución
Convertir el "safe area" en espacio real que empuje el contenido hacia abajo, en vez de superponerse. Dos cambios mínimos:

**1. `src/components/SafeAreaTopBar.tsx`** — quitar `fixed`, hacerlo parte del flujo:
- Cambiar `fixed top-0 inset-x-0 z-50` por simplemente `w-full`.
- Mantener `bg-black` y la altura `env(safe-area-inset-top)`.
- Sin `pointer-events-none` (ya no hace falta porque no se superpone a nada).

Resultado: el `<div>` ocupa altura real al inicio del `<body>` y empuja todo lo que viene después.

**2. `src/App.tsx`** — envolver Routes + SafeArea en un contenedor flex columna para que el safe area sea el primer hijo y el resto fluya debajo:
- Cambiar la estructura para que `ConditionalSafeArea` y `<Routes>` vivan dentro de un `<div className="min-h-[100dvh] flex flex-col">`.
- Las páginas siguen siendo `min-h-[100dvh]`; al estar debajo de un bloque que ya consumió el safe-area se ven completas.

### Por qué este enfoque
- No hay que tocar cada página individualmente añadiendo `padding-top`.
- El header de cada vista (banner con botón volver) sigue arrancando en `top:3` relativo a su contenedor, pero ahora su contenedor empieza debajo de la zona del notch, no debajo de la barra negra.
- En desktop / superadmin la barra sigue oculta (lógica `ConditionalSafeArea` intacta), así que no afecta al panel.

### Ajuste en páginas con `min-h-[100dvh]`
Las páginas usan `min-h-[100dvh]` lo cual sumado al safe-area podría producir scroll mínimo en algunos dispositivos. Cambio defensivo: en el contenedor padre de `App.tsx` no fijar altura, dejar que cada página gestione la suya. El safe-area ya consumido + `100dvh` de la página = altura total visible + barra; el navegador maneja el resto sin problema (es lo mismo que un header fijo de 44px en iOS PWA).

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/components/SafeAreaTopBar.tsx` | Quitar `fixed`/`z-50`, dejar como bloque normal |
| `src/App.tsx` | Envolver `ConditionalSafeArea` + `Routes` en un `<div className="flex flex-col min-h-[100dvh]">` para que el safe-area empuje el flujo |

### Cómo verificar
1. Abrir la PWA en iPhone (o simular con devtools, viewport 390×844 + simular notch).
2. Entrar a `/menu` → la imagen del banner se ve completa, no recortada por arriba.
3. Entrar a `/categoria/macho` → el botón ← de volver se ve completo, no tapado por la barra negra.
4. Entrar a `/animal/:id` → los botones ← y ✏️ visibles bajo el notch.
5. Entrar a `/superadmin` desde desktop → no aparece la barra negra (comportamiento sin cambios).
6. Dispositivos sin notch (Android estándar) → `env(safe-area-inset-top)` = 0, no se ve cambio visual.

