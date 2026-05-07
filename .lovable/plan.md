
# Refactor: Finca activa como contexto global

## 1. Concepto

Toda la app vive "dentro de una finca". Tras login el usuario elige (o se selecciona automáticamente) una **finca activa** que se guarda en `localStorage` + `FincaContext`. Todas las consultas (animales, empleados, potreros, agente IA…) filtran por ese `fincaId`. Para ver otra finca el usuario toca el chip "📍 Nombre · Cambiar" en el header y vuelve a `/fincas`.

No metemos `:fincaId` en cada URL: las rutas existentes no se tocan, solo cambia el filtro interno. Más simple y más natural para usuarios poco técnicos.

## 2. Flujo de navegación

```text
Login OK
  ├─ 0 fincas accesibles  → pantalla "No tienes fincas asignadas"
  ├─ 1 finca              → set activa → /menu
  └─ 2+ fincas            → /fincas (modo selector)

/fincas (selector)
  └─ tap finca → set activa → /menu
  └─ lápiz (admin) → editar finca (no cambia activa)
  └─ FAB + (admin) → crear finca

/menu  (genético — finca activa)
  ├─ Header: chip "📍 La Esperanza · Cambiar" → /fincas
  ├─ Toros / Hembras / Crías / Embriones (ya existen)
  └─ NUEVO botón grande "Gestión de finca" → /menu-finca

/menu-finca  (operación — finca activa)
  ├─ Mismo header con chip
  └─ Empleados · Potreros · Animales (finca) · Inventario · Compra · Venta
```

## 3. FincaContext (nuevo)

`src/contexts/FincaContext.tsx`:
- `fincaActiva: Finca | null`
- `fincasAccesibles: Finca[]` (cargadas una vez al login)
- `setFincaActiva(finca)` → guarda en `localStorage["jps_finca_activa_id"]`
- `clearFincaActiva()` → al hacer logout
- Hidratación inicial: lee `localStorage`, valida que la finca aún esté en `fincasAccesibles`; si no, la limpia.

Provider montado en `App.tsx` dentro de `AuthProvider`.

Hook helper `useFincaActiva()` que **lanza error** si se usa sin finca activa, así detectamos páginas que deberían redirigir.

## 4. Cambios por archivo

### Auth y entrada
- `src/pages/Auth.tsx` (o componente login): tras login exitoso, cargar fincas accesibles del usuario y aplicar lógica de redirección (0/1/2+).
- Nuevo `src/components/RequireFinca.tsx`: wrapper que redirige a `/fincas` si no hay finca activa. Envuelve `/menu`, `/menu-finca`, `/categoria/*`, `/animal/*`, `/finca-modulo/*`.

### `/fincas` (`src/pages/Fincas.tsx`)
- Tap card → `setFincaActiva(f)` + `navigate('/menu')`.
- Lápiz pequeño (admin/super) en cada card → abre `FincaForm`.
- FAB + queda igual.
- Si llega aquí "vacío" (0 fincas), mostrar empty state.

### `/menu` (`src/pages/Menu.tsx`)
- Header: agrega componente `<FincaActivaChip />` arriba (chip discreto, ícono pin + nombre, tap → `/fincas`).
- Filtrar conteos/listados por `fincaActiva.id`.
- Agregar tarjeta nueva "Gestión de finca" → `/menu-finca`.

### `/menu-finca` (NUEVO `src/pages/MenuFinca.tsx`)
- Misma estructura visual que `/menu`, con `<FincaActivaChip />`.
- 6 tarjetas: Empleados, Potreros, Animales (finca), Inventario, Compra, Venta.
- Las 3 últimas como placeholders por ahora.

### Categorías genéticas
- `src/pages/CategoriaAnimales.tsx`: agregar `.eq('finca_id', fincaActiva.id)` al query principal y al conteo.
- `src/components/AnimalForm.tsx`: preseleccionar `finca_id = fincaActiva.id` y ocultar el selector (o mostrarlo solo lectura). Admins igual no necesitan elegir porque están "dentro" de la finca.

### Módulos de finca (Empleados, Potreros, Animales)
- `src/pages/Finca/Empleados.tsx`, `Potreros.tsx`, `Animales.tsx`: crear filtrando por `fincaActiva.id`. Forms preseleccionan la finca.
- Empleados: al crear, automáticamente se inserta fila en `empleado_fincas` con la finca activa (admin puede luego asignar a más fincas desde la edición del empleado).

### Agente IA por voz
- **Operario**: el botón/FAB del agente NO se renderiza.
- **Admin / super_admin**: visible. El agente recibe contexto: "El usuario está actualmente en la finca <Nombre>. Por defecto responde sobre esa finca. Si te preguntan explícitamente por todas o por otra finca, puedes consultar globalmente."
- Client tools del agente (consultar animales, etc.) reciben `fincaIdContexto` por defecto pero aceptan parámetro `scope: "actual" | "todas" | fincaId` para flexibilidad de admin.

### Header / chip
- `src/components/FincaActivaChip.tsx`: chip pequeño (icono `MapPin`, nombre finca, separador, "Cambiar"). Estilo discreto en gold/black sutil. Tap → `/fincas`.

### Logout
- `useAuth` logout: llamar `clearFincaActiva()`.

## 5. Base de datos

**Sin cambios de schema.** Todo el filtrado se hace en cliente con `.eq('finca_id', ...)` aprovechando las RLS ya existentes (que ya permiten ver solo fincas accesibles, así que un admin malicioso tampoco puede pedir una finca a la que no tiene acceso).

## 6. Permisos por rol (recordatorio)
- **super_admin / admin**: ven el chip, pueden cambiar finca, ven el agente IA, CRUD completo en módulos de finca.
- **operario**: ve el chip y puede cambiar entre sus fincas asignadas, NO ve el agente IA, lectura en módulos de finca, CRUD en categorías genéticas según permisos actuales.

## 7. Cosas que NO entran en este paso
- Inventario, Compra, Venta (placeholders).
- URLs con `:fincaId` (se puede agregar después si se quiere link compartible).
- Cambios en RLS.

## 8. Preguntas que tengo (puedes responder al aprobar o me dices "tal cual")

1. **Admin sin finca activa entra al agente IA**: ¿debería forzarlo a elegir una finca primero, o permitir modo "global"? Mi sugerencia: **forzar elegir una** (consistencia y simplicidad).
2. **Cuando un admin crea una finca nueva**: ¿la seteamos como activa automáticamente? Sugerencia: **sí**.
3. **Editar finca desde lápiz en `/fincas`**: ¿debe cambiar también la finca activa o solo abrir el editor? Sugerencia: **solo editor, no cambia activa**.

Si cualquiera de estas no te cuadra, dímelo al aprobar y ajusto antes de implementar.
