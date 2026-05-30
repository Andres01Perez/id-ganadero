# Exportar información a Excel (personalizado + plantillas)

## Objetivo
En `/menu/gestion` agregar un botón **"Exportar información"** que abre un asistente donde el usuario elige qué datos exportar, con qué filtros, y puede guardar/reutilizar plantillas. El resultado siempre se descarga como un archivo `.xlsx` con una hoja por tipo de dato.

## Flujo del asistente (mobile-first, identidad negro+dorado)

Ruta nueva: `/gestion/exportar`

**Paso 1 — Plantillas**
- Tarjeta "Nueva exportación" + lista de plantillas guardadas (propias + compartidas).
- Cada plantilla: nombre, descripción corta, botón "Usar" y, si es del dueño/admin, "Editar" / "Eliminar".

**Paso 2 — Fincas**
- Multiselección de fincas a las que el usuario tiene acceso. Por defecto todas marcadas.

**Paso 3 — ¿Qué quieres exportar?** (multiselección de bloques)
- **Animales**: machos, hembras, crías, embriones (subtipo seleccionable).
- **Seguimientos por animal**: celos, aspiraciones, embriones (detalle), palpaciones, cruces, dieta, peso, partos, chequeos, vacunaciones, medicaciones.
- **Empleados** (por finca seleccionada).
- **Potreros** (por finca seleccionada).

**Paso 4 — Por cada bloque elegido**
- **Campos a incluir** (checkboxes con "Seleccionar todo"). Toma los campos reales de cada tabla con etiquetas en español tomadas de `seguimiento-config.ts` y los animales (número, nombre, raza, color, sexo, fecha nacimiento, finca, padre/madre internos y externos, número de registro).
- **Rango de fechas** (cuando aplica: seguimientos, empleados por ingreso, etc.): "Todas" / "Desde–Hasta" con `Calendar` shadcn.
- **Filtros rápidos por bloque**: tipo de animal (M/H/cría/embrión), activo/inactivo.

**Paso 5 — Guardar plantilla (opcional)**
- Checkbox "Guardar como plantilla" → nombre + descripción + toggle "Compartir con todos en mi organización".
- Sin guardar también se puede exportar directamente.

**Paso 6 — Generar Excel**
- Botón "Exportar a Excel" → ejecuta consulta(s), genera `.xlsx` con `xlsx` (SheetJS) en el cliente y dispara descarga. Una hoja por tipo (`Animales`, `Celos`, `Pesajes`, etc.). En cada hoja de seguimiento se añaden columnas `Animal número` y `Animal nombre` para cruzar.
- Toast con éxito/cantidad de filas por hoja.

## Base de datos

Migración nueva: tabla `export_plantillas`
- Campos de dominio: `nombre`, `descripcion`, `compartida` (bool), `config` (jsonb con la selección completa: fincas, bloques, campos, filtros).
- Estándar: `id`, `created_by`, `created_at`, `updated_at`.

Reglas de acceso:
- Ver: el creador siempre; cualquier usuario activo si `compartida = true`.
- Crear: usuario activo, debe ser el creador.
- Editar: solo el creador o admin/super_admin.
- Eliminar: solo el creador o admin/super_admin.

Permisos Data API (`GRANT`) para `authenticated` y `service_role`. RLS activado con esas políticas.

## Implementación frontend

Archivos nuevos:
- `src/pages/gestion/ExportarInformacion.tsx` — wizard mobile con los pasos arriba (Card/Checkbox/Calendar/Sheet shadcn, tokens semánticos `bg-card`, `bg-gold-solid text-ink`, etc.).
- `src/lib/export-config.ts` — catálogo central de bloques exportables: para cada uno define `tabla`, `etiqueta`, `campos[{key,label,type}]`, `tieneFecha`, `campoFecha`, `requiereFinca`. Reutiliza `seguimientoConfigs` para las etiquetas de seguimientos.
- `src/lib/export-excel.ts` — toma la `config` + resultados y genera el `.xlsx` con `xlsx` (ya disponible o se agrega con `bun add xlsx`). Una hoja por bloque, encabezados en español, formatos básicos de fecha.
- `src/components/export/PlantillaList.tsx`, `BloqueSelector.tsx`, `CamposChecklist.tsx`, `GuardarPlantillaDialog.tsx` — partes del wizard para mantenerlo legible.

Cambios:
- `src/pages/MenuGestion.tsx`: agregar entrada `{ label: "Exportar información", to: "/gestion/exportar" }`.
- `src/App.tsx`: ruta protegida `/gestion/exportar` → `ExportarInformacion`.

## Detalles técnicos

- Dependencia: `xlsx` (SheetJS) en el cliente. Se instala con `bun add xlsx`.
- Las consultas a Supabase se hacen desde el cliente respetando RLS existente (animales por finca, seguimientos por animal accesible).
- Para evitar payloads enormes en móviles: paginación interna con `range()` de 1000 en 1000 por tabla hasta agotar resultados antes de armar el libro.
- El campo `config` en `export_plantillas` es un JSON con la forma:
  ```ts
  {
    fincaIds: string[];
    bloques: Array<{
      key: "animales" | "calor" | "aspiraciones" | ...;
      campos: string[];
      fechaDesde?: string;
      fechaHasta?: string;
      filtros?: { sexo?: "M"|"H"; tipo?: "macho"|"hembra"|"cria"|"embrion"; activo?: boolean };
    }>;
  }
  ```
- Tipos de Supabase se regeneran al aplicar la migración; no se edita `types.ts` a mano.
