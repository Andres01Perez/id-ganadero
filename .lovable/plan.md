# Pantallas reales de /menu-finca

Reemplazar el placeholder genérico de `/finca/:modulo` por tres páginas reales filtradas por `fincaActiva`: **Empleados**, **Potreros** y **Animales**. Inventario / Compra / Venta seguirán como placeholder por ahora.

## 1. Routing (`src/App.tsx`)

Eliminar la ruta única `"/finca/:modulo"` con `PlaceholderPage` y registrar rutas explícitas:

- `/finca/empleados` → `<FincaEmpleados />`
- `/finca/potreros` → `<FincaPotreros />`
- `/finca/animales` → `<FincaAnimales />`
- `/finca/inventario`, `/finca/compra`, `/finca/venta` → `<PlaceholderPage />` (placeholder hasta que se implementen)

Todas envueltas en `ProtectedRoute` + `RequireFinca`, igual que hoy.

## 2. Empleados (`src/pages/finca/Empleados.tsx`)

Lista de empleados de la finca activa + alta/edición.

**Datos**
- Query: `empleados` join con `empleado_fincas` filtrado por `finca_id = fincaActiva.id`. Implementación: primero `select empleado_id from empleado_fincas where finca_id=...`, luego `select * from empleados where id in (...) and activo=true`.
- Mutaciones (admin/super_admin):
  - Crear empleado → insert en `empleados` (con `created_by = user.id`) + insert en `empleado_fincas (empleado_id, finca_id)`.
  - Editar → update en `empleados`.
  - Desactivar → `update empleados set activo=false`.
- Operario: solo lectura (FAB y botón editar ocultos).

**UI**
- Estructura visual idéntica a `CategoriaAnimales` (header con banner de la finca, banda dorada "Empleados", lista, FAB `+`, `BottomTabBar`, `FincaActivaChip`).
- Cada item: nombre completo, cédula, fecha ingreso, avatar circular (`foto_url` o iniciales).
- Tap en el item → abre el sheet en modo edición.
- Buscador rápido por nombre/cédula (input arriba de la lista).

**Form (`EmpleadoForm.tsx` – nuevo componente)**
- Sheet bottom como `AnimalForm`.
- Campos: `nombre_completo*`, `cedula`, `fecha_nacimiento`, `fecha_ingreso`, `notas`, `foto_url` (opcional, subida a `app-assets` o `animal-fotos` con prefix `empleados/`).
- Validación con `zod`.
- Botones: Guardar, Desactivar (solo edición y admin).

## 3. Potreros (`src/pages/finca/Potreros.tsx`)

**Datos**
- Query: `potreros` filtrado por `finca_id = fincaActiva.id`, ordenado por `numero`.
- Estado posible: `descargado` / `cargado` (enum `potrero_estado` ya existente; ver tabla — solo se conoce `descargado` por defecto, asumimos los dos valores estándar; el `Select` se basará en los valores reales del enum: leer en runtime si hay duda, o codificar `["descargado","cargado","mantenimiento"]` como fallback y dejar el `select` libre).
- Admin: crear/editar/eliminar; operario: solo lectura.

**UI**
- Header banner (foto de la finca activa) + banda dorada "Potreros".
- Buscador rápido por número/notas.
- Grid 2 columnas con tarjetas: número grande, badge de estado (color verde=descargado, ámbar=cargado), notas truncadas.
- FAB `+` (admin).
- Tap en tarjeta → abre `PotreroForm`.

**Form (`PotreroForm.tsx` – nuevo)**
- Sheet bottom.
- Campos: `numero*`, `estado*` (Select), `notas` (textarea).
- Botones Guardar / Eliminar (admin).

## 4. Animales por finca (`src/pages/finca/Animales.tsx`)

Vista unificada que une las 4 categorías (machos, hembras, crías, embriones) de la finca activa.

**Datos**
- Query única a `animales` con `eq("finca_id", fincaActiva.id)`, `eq("activo", true)`, `order("numero")`.
- Conteo por tipo en memoria.

**UI**
- Header banner (foto finca) + banda dorada "Animales de la finca".
- Tabs/pills horizontales: `Todos | Machos | Hembras | Crías | Embriones` (con contador entre paréntesis).
- Buscador por número/nombre.
- Lista con el mismo diseño que `CategoriaAnimales` (avatar, nombre, número, badge del tipo).
- Tap → `/animal/:id` (hoja de vida existente).
- FAB `+` que abre `AnimalForm` reutilizado:
  - Si la pestaña activa es una categoría concreta, se pasa `tipo={activeTab}`.
  - Si es "Todos", se muestra primero un mini-selector de tipo y luego se abre el form.

Reutilizamos el componente `AnimalForm` existente (ya preselecciona la `fincaActiva`).

## 5. Detalles técnicos

- Estructura de carpetas nueva: `src/pages/finca/` para las tres páginas.
- Componentes nuevos: `src/components/EmpleadoForm.tsx`, `src/components/PotreroForm.tsx`.
- Ningún cambio de schema en Supabase: las tablas `empleados`, `empleado_fincas`, `potreros`, `animales` y sus RLS ya soportan todo el flujo.
- Tipado: TypeScript estricto, `zod` para validación, `sonner` para toasts.
- Tema: black + gold actual (`bg-card`, `border-gold`, `bg-gold-solid`, `tracking-jps`), mobile-first, mismas dimensiones de header/banda dorada que el resto.
- Permisos en UI: usar `useAuth().roles` para mostrar/ocultar FAB y acciones (`admin` o `super_admin` editan; `operario` solo lee).
- `MenuFinca`: las 3 tarjetas ya enlazan a las rutas correctas, no requiere cambios.

## Fuera de alcance
- Inventario, Compra y Venta (siguen como placeholder, se implementarán después).
- Asignar empleado a múltiples fincas desde esta vista (se puede agregar luego en un panel admin).
