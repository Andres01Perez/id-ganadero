# Plan: Módulo de Finca (Empleados, Potreros, Animales por Finca)

## 1. Cambio de UX en `/fincas`

Hoy al tocar una finca se abre el formulario de edición (solo admin). Cambiamos el comportamiento:

- **Tap en una tarjeta de finca** → navegar a `/finca/:fincaId` (nuevo menú de finca) para todos los roles.
- **Botón lápiz** pequeño en cada tarjeta (solo admin/super_admin) → abre el `FincaForm` actual para editar nombre/ubicación/foto.
- El FAB `+` para crear finca se mantiene igual.

## 2. Nueva página `/finca/:fincaId` — Menú de finca

Estilo igual al `/menu` actual (header con foto de la finca, banda dorada con el nombre, grid 2-col de círculos dorados):

- Empleados
- Potreros
- Animales
- Inventario *(placeholder por ahora)*
- Compra de ganado *(placeholder)*
- Venta de ganado *(placeholder)*

Header usa `fincas.foto_url` (ya existe) con fallback al banner de fincas.

## 3. Base de datos (migraciones)

### 3.1 Empleados (multi-finca, cédula no única, vinculación opcional a usuario)

```text
empleados
  id uuid pk
  nombre_completo text not null
  cedula text             -- no única, solo informativa
  fecha_nacimiento date
  fecha_ingreso date
  fecha_salida date
  activo boolean default true
  foto_url text
  notas text
  user_id uuid            -- opcional, fk lógica a auth.users
  created_by, created_at, updated_at

empleado_fincas             -- N:M
  empleado_id uuid not null
  finca_id uuid not null
  pk (empleado_id, finca_id)
```

RLS:
- SELECT: cualquier usuario activo que tenga acceso a *alguna* de las fincas vinculadas (`exists` sobre `empleado_fincas` + `user_has_finca`).
- INSERT/UPDATE/DELETE: solo `is_admin_or_super`.
- `empleado_fincas`: SELECT igual que arriba; INSERT/DELETE solo admin/super.

### 3.2 Potreros

```text
potreros
  id uuid pk
  finca_id uuid not null
  numero text not null            -- "id" del potrero dentro de la finca
  estado text not null            -- enum: 'cargado' | 'descargado' | 'en_renovacion'
  notas text
  created_by, created_at, updated_at
  unique (finca_id, numero)
```

Enum nuevo `potrero_estado`. RLS:
- SELECT: `user_has_finca(auth.uid(), finca_id)`.
- INSERT/UPDATE/DELETE: `is_admin_or_super` **y** `user_has_finca`.

### 3.3 Animales por finca + tipos globales

```text
tipos_animal_finca           -- catálogo global
  id uuid pk
  nombre text unique not null  -- 'Ternero', 'Novillo', 'Otro', + los que cree el admin
  is_system boolean default false
  created_by, created_at

animales_finca
  id uuid pk
  finca_id uuid not null
  tipo_id uuid not null fk → tipos_animal_finca
  nombre text not null
  edad int                    -- opcional, en años (input simple)
  fecha_ingreso date
  fecha_salida date
  activo boolean default true
  notas text
  created_by, created_at, updated_at
```

Seed inicial: insertar `Ternero`, `Novillo`, `Otro` con `is_system=true`.

RLS:
- `tipos_animal_finca`: SELECT a todos los autenticados activos; INSERT solo admin/super; UPDATE/DELETE bloqueado si `is_system=true`.
- `animales_finca`: SELECT por `user_has_finca`; INSERT/UPDATE/DELETE admin/super + `user_has_finca`. Operario solo ve.

### 3.4 Storage

Reutilizamos el bucket `app-assets` con prefijo `empleados/{empleadoId}.{ext}` para fotos.

## 4. Rutas y archivos nuevos

```text
src/pages/Finca/
  Layout.tsx           (header foto + banda dorada + back)
  MenuFinca.tsx        (/finca/:fincaId)
  Empleados.tsx        (/finca/:fincaId/empleados)
  EmpleadoDetalle.tsx  (/finca/:fincaId/empleados/:id)  -- opcional: edit en dialog en su lugar
  Potreros.tsx         (/finca/:fincaId/potreros)
  Animales.tsx         (/finca/:fincaId/animales)

src/components/finca/
  EmpleadoForm.tsx     (dialog crear/editar; admin only; foto con ImageCropDialog circular)
  EmpleadoAvatar.tsx   (foto o ícono User; aplica filter grayscale+opacity si !activo)
  PotreroForm.tsx      (dialog: número + select estado)
  AnimalFincaForm.tsx  (dialog: nombre, tipo con select + opción "Otro" → input crea tipo nuevo, edad, fechas, activo, notas)
```

Rutas registradas en `src/App.tsx` con `ProtectedRoute` (todas requieren login; CRUD se restringe en UI por `roles`).

## 5. UI por pantalla

### Empleados (`/finca/:fincaId/empleados`)
- Layout idéntico a `/categoria/hembra`: header con foto de finca, banda dorada "Empleados", lista con avatar circular + nombre + cédula.
- Si `!activo`: avatar con `grayscale opacity-60` y texto en gris claro.
- Tap en tarjeta → abre `EmpleadoForm` (admin: edición / operario: solo lectura, todos los inputs `disabled`).
- FAB `+` solo para admin/super.

### Potreros
- Lista compacta de filas: `Potrero #{numero}` + badge de estado (cargado=verde, descargado=gris, renovación=ámbar) + ícono lápiz al final (admin).
- FAB `+` admin.

### Animales (inventario de finca)
- Lista similar a empleados pero sin foto; muestra nombre + tipo + estado.
- Form con select de tipo: la última opción es "Otro…" → al elegirla aparece un input `Nuevo tipo` + botón "Crear"; al guardar, inserta en `tipos_animal_finca` y deja seleccionado el nuevo id.
- Filtro/buscador opcional al inicio (no requerido por ahora; lo dejo fuera).

## 6. Permisos por rol (resumen)

| Acción | super_admin | admin | operario |
|---|---|---|---|
| Ver módulos finca | ✓ | ✓ | ✓ (solo fincas asignadas) |
| Crear/editar/eliminar empleados | ✓ | ✓ | ✗ |
| Crear/editar/eliminar potreros | ✓ | ✓ | ✗ |
| Crear/editar/eliminar animales finca | ✓ | ✓ | ✗ |
| Crear nuevo tipo de animal | ✓ | ✓ | ✗ |

Se hace doble guardia: RLS en BD + ocultar/disabled en UI.

## 7. No incluido en este plan

- Funcionalidades 4 (Inventario), 5 (Compra) y 6 (Venta) — quedan como tarjetas placeholder en el menú de finca, navegando a un `PlaceholderPage` hasta que las definamos.
- Cumpleaños / cálculo de edad: solo se calcula en el front a partir de `fecha_nacimiento` para mostrar; sin notificaciones todavía.

¿Procedo con la implementación?
