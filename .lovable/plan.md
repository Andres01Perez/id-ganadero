## Módulo Inventario

Cada finca tiene **su propio inventario**, dividido en 3 categorías: **Alimentación**, **Medicina** y **Otros**. Todos los productos y movimientos pertenecen a la finca activa (`fincaActiva.id` del `FincaContext`) y se filtran por ella en la UI y en RLS.

### 1. Navegación

```text
/menu-finca
   └─ Botón "Inventario"
        ↓
/categoria-inventario          → 3 botones grandes: Alimentación, Medicina, Otros
                                  (mismo estilo visual que MenuFinca)
        ↓
/inventario/:categoria         → Lista de productos de esa categoría
                                  para la finca activa, ordenada por urgencia
        ├─ Botón "+ Nuevo producto" → Formulario crear/editar
        └─ Tap en producto:
             ↓
/inventario/producto/:id       → Ficha del producto:
                                  - Datos del producto
                                  - Stock actual
                                  - Botones [+ Entrada] [- Salida]
                                  - Historial de movimientos
                                  - Editar / Eliminar
```

Cada vista de inventario muestra el chip de finca activa en el header (igual que el resto de la app) y respeta safe areas.

### 2. Campos por categoría

**Comunes a las 3:** nombre, cantidad actual (calculada), unidad de medida, punto mínimo, importancia, fecha de vencimiento (opcional), notas.

- **Alimentación:** marca (opcional), tipo de alimento (texto libre: concentrado, sal mineralizada, heno, melaza…).
- **Medicina:** laboratorio (opcional), vía de administración (opcional, texto libre).
- **Otros:** ubicación física (opcional, ej: "estantería del fondo").

### 3. Unidades de medida (catálogo dinámico, global)

Tabla `unidades_medida` (compartida entre fincas, igual a `tipos_animal_finca`):
- Pre-cargada con: Kilogramo (kg), Gramo (g), Litro (L), Mililitro (ml), Galón, Unidad, Bulto, Metro (m), Centímetro (cm), Dosis.
- En el formulario: `<Select>` con todas las unidades + "**Otro…**" al final. Al elegir "Otro…" aparece un input para crear la nueva unidad (mismo patrón ya usado en `AnimalFincaForm`).
- Cualquier usuario activo puede crear; solo admin renombra/elimina; las del sistema (`is_system=true`) no se borran.

### 4. Importancia y urgencia

**Importancia** (elegida por el usuario, default **Estándar**):
- `estandar` (default — ej: tijeras, baldes, no pasa nada)
- `baja`
- `media`
- `alta`

**Urgencia** (calculada en frontend, no se guarda):
- **Crítica (rojo):** stock ≤ punto mínimo, **o** vence en ≤ 7 días, **o** ya vencido.
- **Advertencia (amarillo):** stock ≤ 1.5× punto mínimo, **o** vence en ≤ 30 días.
- **OK (verde):** por encima de los umbrales.

Orden en la lista: por urgencia (Crítica → Advertencia → OK), y dentro de cada nivel por importancia (Alta → Media → Baja → Estándar).

### 5. Transacciones (entradas/salidas)

Solo se piden:
- Tipo: Entrada o Salida.
- Cantidad (positiva).
- Fecha (default hoy).
- Notas (opcional).

Stock actual = `SUM(entradas) - SUM(salidas)`. No se permite salida que deje stock negativo (validación frontend con mensaje claro).

### 6. Avisos

En `/menu-finca` y en el header de `/categoria-inventario`, mostrar un **chip rojo** con el conteo de productos en estado Crítico de la finca activa, para que el usuario entre a revisar.

### 7. Permisos

- Ver/crear/editar productos y registrar movimientos: cualquier usuario con acceso a la finca.
- Borrar producto: cualquier usuario con acceso a la finca (con confirmación; los movimientos se borran en cascada).
- Catálogo de unidades de medida: crear todos, editar/borrar solo admin.

---

## Detalles técnicos

### Enums nuevos

- `inventario_categoria`: `'alimentacion' | 'medicina' | 'otros'`
- `inventario_importancia`: `'estandar' | 'baja' | 'media' | 'alta'` (default `'estandar'`)
- `inventario_movimiento_tipo`: `'entrada' | 'salida'`

### Tablas nuevas

**`unidades_medida`** (global)
- `id`, `nombre` (text, unique case-insensitive), `abreviatura` (text null), `is_system` (bool default false), `created_by`, `created_at`.

**`inventario_productos`** (por finca)
- `id`, `finca_id` (NOT NULL, indexado), `categoria` (enum), `nombre`, `unidad_id` (FK `unidades_medida`),
- `punto_minimo` (numeric default 0), `importancia` (enum default `'estandar'`), `fecha_vencimiento` (date null), `notas` (text null),
- Específicos (text null, según categoría): `marca`, `tipo_alimento`, `laboratorio`, `via_administracion`, `ubicacion`,
- `activo` (bool default true), `created_by`, `created_at`, `updated_at`.
- Índice: `(finca_id, categoria, activo)`.

**`inventario_movimientos`**
- `id`, `producto_id` (FK con `ON DELETE CASCADE`), `tipo` (enum), `cantidad` (numeric > 0), `fecha` (date), `notas` (text null), `responsable_id`, `created_at`.

### Funciones y RLS

Nueva función security-definer:
```sql
user_can_access_producto(_user_id uuid, _producto_id uuid)
-- equivalente a user_can_access_animal pero validando finca del producto
```

- `inventario_productos`: SELECT/INSERT/UPDATE/DELETE con `user_has_finca(auth.uid(), finca_id)` (insert también valida `created_by = auth.uid()` y `is_active_user`).
- `inventario_movimientos`: SELECT/INSERT/UPDATE/DELETE con `user_can_access_producto(auth.uid(), producto_id)`.
- `unidades_medida`: SELECT abierto a usuarios activos; INSERT con `is_active_user`; UPDATE/DELETE solo admin y `is_system = false`.

Triggers: `update_updated_at_column` en `inventario_productos`; `audit_trigger` en `inventario_productos` y `inventario_movimientos`.

### Frontend

Rutas nuevas en `App.tsx` (todas dentro de `ProtectedRoute` + `RequireFinca`):
- `/categoria-inventario` → `CategoriaInventario.tsx`
- `/inventario/:categoria` → `InventarioLista.tsx`
- `/inventario/producto/:id` → `InventarioProducto.tsx`

Componentes nuevos:
- `InventarioProductoForm.tsx` (campos condicionales por categoría)
- `MovimientoDialog.tsx` (sheet entrada/salida)
- `UnidadMedidaSelect.tsx` (reusable, "Otro…" inline)
- `UrgenciaBadge.tsx`
- `ImportanciaBadge.tsx`

Helper `src/lib/inventario.ts`: `calcularStock`, `calcularUrgencia`, `ordenarPorUrgencia`, `contarCriticos`.

Todas las consultas filtran por `finca_id = fincaActiva.id`. Estilo gold/black, safe areas (`pt-safe-plus`, `pb-safe-plus`), patrón visual de `MenuFinca` y `CategoriaAnimales` ya existentes.

### Migración (un solo archivo)

1. Crear los 3 enums.
2. Crear `unidades_medida` + seed inicial.
3. Crear `inventario_productos` y `inventario_movimientos`.
4. Crear función `user_can_access_producto`.
5. RLS policies en las 3 tablas.
6. Triggers `updated_at` y `audit_trigger`.
