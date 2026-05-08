## Objetivo

Crear la sección **Otros** (`/otros`) con dos opciones iniciales en formato pill dorado:

1. **Ganado Inactivo** — animales de cabecera (`animales`) con `activo = false` de la finca activa, con opción de **Reactivar**.
2. **Movimientos** — bitácora de auditoría inmutable con fecha, usuario y descripción del movimiento, filtrada por la finca activa.

---

## 1. Página `/otros`

**Nuevo archivo:** `src/pages/Otros.tsx`
- Header con back, banner consistente con `MenuFinca`, título "Otros".
- Cuerpo: lista vertical de botones tipo pill dorado:
  ```html
  <button class="bg-gold-solid text-ink rounded-full py-3 px-4 text-sm font-semibold uppercase tracking-wider shadow-gold active:scale-95 transition-transform">
    Ganado Inactivo
  </button>
  <button …>Movimientos</button>
  ```
- `BottomTabBar` al pie.

**Ruta:** registrar `/otros` en `src/App.tsx` (reemplaza el placeholder genérico) protegido con `RequireFinca`.

---

## 2. Ganado Inactivo

**Nuevo archivo:** `src/pages/otros/GanadoInactivo.tsx` (ruta `/otros/ganado-inactivo`).

- Query: `animales` donde `finca_id = fincaActiva.id` y `activo = false`, ordenados por `updated_at desc`.
- Lista compacta: número, nombre, tipo, foto pequeña.
- Cada item con botón **Reactivar** → `update animales set activo = true`. Confirmación previa con `AlertDialog`.
- Estado vacío amable.
- No abre hoja de vida (decisión del usuario: solo ver + reactivar).

> **Importante:** la página actual `CategoriaAnimales` debe seguir mostrando solo `activo = true`. Verificar y, si filtra todos, agregar `eq("activo", true)`.

---

## 3. Movimientos (auditoría)

### 3.1 Base de datos

Ya existen:
- Tabla `audit_log` (id, tabla, registro_id, accion, cambios jsonb, usuario_id, usuario_display_name, created_at) con RLS solo SELECT para admin/super.
- Función `audit_trigger()`.

**Cambios requeridos** (vía `supabase--migration`):

a) **Agregar columna `finca_id uuid`** a `audit_log` para poder filtrar por finca activa con RLS.

b) **Reescribir `audit_trigger()`** para resolver `finca_id` según la tabla:
   - Tablas con `finca_id` directo: `animales`, `animales_finca`, `potreros`, `inventario_productos`, `fincas` (usa `id`), `empleado_fincas`.
   - Tablas hijas de animal (`vacunaciones`, `medicaciones`, `pesajes`, `palpaciones`, `inseminaciones`, `partos` (vía madre), `chequeos_veterinarios`, `dietas`, `ciclos_calor`, `aspiraciones`, `campeonatos`, `embriones_recolectados` (vía donadora), `embriones_detalle`): hacer lookup a `animales.finca_id`.
   - `inventario_movimientos`: lookup vía `inventario_productos.finca_id`.
   - `empleados`: NULL (visible para admin global; o bien, replicar a cada finca asociada — decisión: NULL y mostrar a admin/super sin filtro).
   - `user_finca_acceso`: usar el `finca_id` del registro.

c) **Actualizar RLS de `audit_log`**:
   - Mantener: solo SELECT (sin INSERT/UPDATE/DELETE para usuarios — el trigger inserta como SECURITY DEFINER).
   - Política nueva SELECT: usuarios autenticados activos pueden ver registros donde `user_has_finca(auth.uid(), finca_id)`; admin/super ven todo (incluido `finca_id IS NULL`).
   - El usuario pidió: "inmutable, admins y empleados solo lo ven". Confirmado: ningún rol puede insertar/actualizar/borrar manualmente.

d) **Crear triggers** `AFTER INSERT OR UPDATE OR DELETE FOR EACH ROW EXECUTE FUNCTION audit_trigger()` en:
   - `animales`, `animales_finca`, `potreros`, `inventario_productos`, `inventario_movimientos`, `empleados`, `empleado_fincas`, `fincas`, `user_finca_acceso`
   - Tablas de seguimiento animal listadas arriba.
   - **Excluir**: `audit_log`, `profiles`, `user_roles`, `app_assets`, `unidades_medida` (configuración global / no operativas).

e) Índice: `CREATE INDEX ON audit_log (finca_id, created_at DESC)`.

### 3.2 UI

**Nuevo archivo:** `src/pages/otros/Movimientos.tsx` (ruta `/otros/movimientos`).

- Tabla / lista mobile-first con columnas: **Fecha** (created_at en zona local), **Usuario** (`usuario_display_name`), **Movimiento** (texto legible).
- Mapeo legible por tabla+acción → ej. `animales`+`INSERT` = "Creó animal #123 (Toro)". Helper `formatAuditEvent(row)` con diccionario de tablas y campos clave a extraer de `cambios`.
- Filtros simples: selector de tabla (Todas / Animales / Inventario / …) y rango de fecha (hoy / 7d / 30d / todo).
- Paginación o scroll infinito (lotes de 50, ordenado `created_at desc`).
- Solo lectura. Sin acciones de editar/borrar.

---

## 4. Detalles técnicos

```text
audit_log (final)
├── id, tabla, registro_id, accion, cambios jsonb
├── usuario_id, usuario_display_name
├── finca_id uuid NULL          ← NUEVO
└── created_at

RLS:
  SELECT: is_admin_or_super(auth.uid())
       OR (finca_id IS NOT NULL AND user_has_finca(auth.uid(), finca_id))
  INSERT/UPDATE/DELETE: ninguna política (denegado para todos los roles autenticados).
  Trigger inserta vía SECURITY DEFINER → bypassa RLS.
```

Resolución de `finca_id` dentro de `audit_trigger()`: bloque `CASE TG_TABLE_NAME` con SELECTs puntuales sobre la tabla padre cuando aplique.

---

## 5. Archivos a crear / editar

- **Crear:** `src/pages/Otros.tsx`, `src/pages/otros/GanadoInactivo.tsx`, `src/pages/otros/Movimientos.tsx`, helper `src/lib/audit-format.ts`.
- **Editar:** `src/App.tsx` (rutas `/otros`, `/otros/ganado-inactivo`, `/otros/movimientos`); revisar `src/pages/CategoriaAnimales.tsx` para asegurar filtro `activo = true`.
- **Migración:** ampliar `audit_log`, reescribir `audit_trigger`, ajustar RLS, crear triggers en todas las tablas operativas.

---

## Confirmación

¿Procedo con esta implementación? Si quieres incluir/excluir alguna tabla del log o cambiar el comportamiento de Reactivar (p. ej. agregar también "Eliminar definitivo"), avísame antes de implementar.