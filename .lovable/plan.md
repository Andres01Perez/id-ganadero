## Resumen

Reorganizar la app para que los animales (machos, hembras, crías, embriones) sean **globales** (visibles y editables por cualquier usuario activo), mientras que la gestión de finca (empleados, potreros, animales-finca, inventario, compra/venta) siga atada a una finca seleccionada. La pantalla `/otros` se mueve al menú principal como `/menu/gestion`.

## Nuevo flujo de navegación

```
Login → /menu  (animales globales + Fincas + Gestión)
                 ├─ Machos / Hembras / Crías / Embriones  → /categoria/:tipo  (todos los animales)
                 │     └─ /animal/:id  (muestra finca a la que pertenece)
                 ├─ Fincas → /fincas → seleccionar → /finca/:id/menu-finca
                 │     ├─ /finca/:id/empleados
                 │     ├─ /finca/:id/potreros
                 │     ├─ /finca/:id/animales-finca   (conteos por finca)
                 │     ├─ /finca/:id/inventario
                 │     ├─ /finca/:id/compra-venta
                 │     └─ Otros (botón inactivo, sin función por ahora)
                 └─ Gestión → /menu/gestion (Ganado Inactivo + Movimientos globales)
```

## Cambios en base de datos (migración)

Animales y todas sus tablas hijas pasan a ser visibles/editables por cualquier usuario activo. `finca_id` se mantiene en `animales` para mostrarlo en la hoja de vida.

- **`animales`**: reemplazar las 4 políticas RLS (`view/insert/update/delete ... by finca`) por políticas que solo requieran `is_active_user(auth.uid())`. `finca_id` sigue NOT NULL.
- **Tablas hijas que usan `user_can_access_animal`** (vacunaciones, medicaciones, pesajes, palpaciones, inseminaciones, chequeos_veterinarios, dietas, ciclos_calor, aspiraciones, campeonatos, embriones_detalle, partos, embriones_recolectados): reemplazar políticas para que solo exijan `is_active_user(auth.uid())` y, en INSERT, `responsable_id = auth.uid()`.
- **No se tocan**: `animales_finca`, `potreros`, `inventario_productos`, `inventario_movimientos`, `empleados`, `empleado_fincas`, `user_finca_acceso`, `fincas` — siguen filtradas por finca.

## Cambios de frontend

### Rutas (`src/App.tsx`)
- Eliminar `RequireFinca` de: `/menu`, `/categoria/:tipo`, `/animal/:id`, `/animal/:id/seguimiento/:tipo`.
- Reemplazar la ruta plana `/menu-finca` por anidada con parámetro: `/finca/:fincaId/menu-finca`.
- Reescribir `/finca/empleados`, `/finca/potreros`, `/finca/animales` como `/finca/:fincaId/empleados`, `/finca/:fincaId/potreros`, `/finca/:fincaId/animales-finca` (envueltas con `RequireFinca`).
- Mover `/categoria-inventario`, `/inventario/:categoria`, `/inventario/producto/:id` bajo `/finca/:fincaId/...` (mismo `RequireFinca`).
- Añadir `/menu/gestion` con un nuevo componente `MenuGestion` que muestre los botones "Ganado Inactivo" y "Movimientos" (datos globales).
- Mover `/otros/ganado-inactivo` → `/gestion/ganado-inactivo` y `/otros/movimientos` → `/gestion/movimientos` (sin `RequireFinca`).
- Eliminar las rutas `/otros`, `/otros/ganado-inactivo`, `/otros/movimientos`, `/finca/:modulo` (placeholder).

### Contexto de finca (`src/contexts/FincaContext.tsx`)
- Mantener pero ya **no** se exige finca activa para entrar a `/menu`.
- `Fincas.tsx`: al seleccionar finca, navegar a `/finca/:id/menu-finca` (en lugar de a `/menu`).
- Crear hook `useFincaFromRoute()` o ajustar `RequireFinca` para que lea `:fincaId` de la URL, valide acceso vía `fincasAccesibles`, y la marque como activa. Si no tiene acceso → redirigir a `/fincas`.

### Pantallas
- **`Menu.tsx`**: cambiar el item "Gestión" para que apunte a `/menu/gestion` (no a `/menu-finca`). Quitar `FincaActivaChip` (ya no aplica en menú global).
- **`CategoriaAnimales.tsx`**: quitar el filtro `.eq("finca_id", fincaActiva.id)` y todas las dependencias de `useFinca`/`FincaActivaChip`. Cargar todos los animales del tipo solicitado.
- **`HojaVidaAnimal.tsx`**: agregar en el bloque de info general el nombre de la finca a la que pertenece el animal (consulta a `fincas` por `finca_id`).
- **`AnimalForm.tsx`**: dejar el selector de finca obligatorio (tal cual está ahora) — el usuario sigue eligiendo a qué finca pertenece. Cambiar el origen del listado: en vez de `user_finca_acceso`, traer todas las fincas activas (cualquiera puede asignar a cualquier finca).
- **`MenuFinca.tsx`**: leer `:fincaId` de la URL. Cambiar todos los `to` a `/finca/:fincaId/empleados`, etc. El botón "Otros" queda visible pero **deshabilitado** (sin onClick, opacidad reducida, cursor not-allowed). Botón "Volver" navega a `/fincas`.
- **`finca/Empleados.tsx`, `finca/Potreros.tsx`, `finca/Animales.tsx`, `CategoriaInventario.tsx`, `InventarioLista.tsx`, `InventarioProducto.tsx`**: leer `:fincaId` de la URL en vez de `useFinca().fincaActiva`; el "Volver" navega a `/finca/:fincaId/menu-finca`.
- **Crear `MenuGestion.tsx`** (en `src/pages/`): basada en `Otros.tsx`, dos botones grandes que navegan a `/gestion/ganado-inactivo` y `/gestion/movimientos`. Sin `FincaActivaChip`.
- **Mover `otros/GanadoInactivo.tsx` → `gestion/GanadoInactivo.tsx`** y **`otros/Movimientos.tsx` → `gestion/Movimientos.tsx`**: quitar dependencia de `fincaActiva`, cargar datos globales (sin filtrar por finca). El "Volver" va a `/menu/gestion`.
- **Eliminar `Otros.tsx`** (ya no se usa).
- **`SearchDialog.tsx`** y **`agent-tools.ts`**: si filtran animales por finca, quitar ese filtro.

### Detalles UX
- `FincaActivaChip` solo se muestra dentro de las rutas `/finca/:fincaId/...`.
- En `/animal/:id`, mostrar la finca del animal como texto informativo (no como chip de finca activa).
- El botón "Otros" dentro de `/finca/:fincaId/menu-finca` se renderiza con estilo deshabilitado (`opacity-50 pointer-events-none` o similar) y sin navegación.

## Verificación post-cambio

1. Login con un operario sin fincas asignadas → debe poder entrar a `/menu` y ver/editar todos los animales.
2. Crear animal desde `/menu` → selector de finca muestra todas las fincas activas.
3. Hoja de vida `/animal/:id` muestra el nombre de la finca.
4. `/fincas` → seleccionar → `/finca/:id/menu-finca` con los 6 botones, "Otros" deshabilitado.
5. `/menu/gestion` muestra Ganado Inactivo y Movimientos con datos de todas las fincas.
6. Rutas viejas `/menu-finca` y `/otros` ya no existen (404 esperado).
