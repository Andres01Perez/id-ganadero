## Objetivo

Simplificar el módulo "Animales de la finca" para registrar solo **tipo de animal + cantidad** (sin nombres, fechas, estado ni tabla separada de tipos).

Resultado final esperado en pantalla:
```
- Caballos     10
- Yeguas        3
- Novillos      8
- Gallinas    500
```

## Cambios en base de datos

**Tabla `animales_finca` — rediseño:**
- Eliminar columnas: `tipo_id`, `nombre`, `edad`, `fecha_ingreso`, `fecha_salida`, `activo`, `notas`.
- Agregar columnas:
  - `tipo` (text, NOT NULL) — ej. "Caballos", "Novillos".
  - `cantidad` (integer, NOT NULL, default 0, >= 0).
- Agregar índice único `(finca_id, lower(tipo))` para evitar duplicados por finca.
- Mantener: `id`, `finca_id`, `created_by`, `created_at`, `updated_at`.
- Las políticas RLS actuales siguen sirviendo (se basan en `finca_id`), no se tocan.

**Tabla `tipos_animal_finca`:**
- Eliminar la tabla por completo (ya no se usará).

> Nota: los datos actuales de `animales_finca` se perderán con esta migración (la estructura cambia). Es información de pruebas; si tienes registros que quieras conservar pídemelo y los migramos antes.

## Cambios en código

**`src/pages/finca/Animales.tsx`** (listado):
- Quitar buscador y avatar.
- Mostrar lista simple: nombre del tipo a la izquierda, cantidad grande a la derecha.
- Tap sobre un item → abre el form para editar tipo/cantidad o eliminar.
- FAB "+" → abre el form para crear nuevo registro.

**`src/components/AnimalFincaForm.tsx`** (formulario):
- Reducir a 2 campos:
  - **Animal** (input de texto, ej. "Caballos").
  - **Cantidad** (input numérico, entero ≥ 0).
- Botones: Guardar / Eliminar (en edición).
- Quitar toda la lógica de tipos, fechas, edad, notas, switch activo.

**`src/integrations/supabase/types.ts`:**
- Se regenera automáticamente tras la migración.

## Detalles técnicos

```text
animales_finca (final)
├── id            uuid pk
├── finca_id      uuid not null
├── tipo          text not null
├── cantidad      int  not null default 0 check (cantidad >= 0)
├── created_by    uuid
├── created_at    timestamptz
└── updated_at    timestamptz

unique index: (finca_id, lower(tipo))
```

Orden de la migración:
1. `DROP TABLE tipos_animal_finca CASCADE` (esto remueve la FK desde `animales_finca.tipo_id`).
2. `ALTER TABLE animales_finca` para borrar columnas obsoletas y agregar `tipo` + `cantidad`.
3. Crear índice único.
4. Mantener trigger de `updated_at` si existe.

## Confirmación

¿Procedo con esta simplificación? Si tienes datos en `animales_finca` que quieras conservar, dímelo antes para hacer un mapeo manual; de lo contrario asumo que se pueden descartar.
