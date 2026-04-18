

## Plan: Limpiar tabla `animales` y mover campos de embrión a tabla separada

### Problema
La tabla `animales` tiene 4 campos que solo aplican cuando `tipo='embrion'`:
- `donadora_id`, `receptora_id`, `fecha_transferencia`, `estado_embrion`

Esto ensucia la tabla central. Tienes razón: deben vivir en su propia tabla.

### Solución

**1. Migración SQL:**
- Crear tabla `embriones_detalle`:
  ```text
  embriones_detalle
    id, animal_id (fk a animales, único — 1:1),
    donadora_id (fk a animales),
    receptora_id (fk a animales, nullable),
    fecha_transferencia (date, nullable),
    estado_embrion (enum existente, nullable),
    responsable_id, created_at
  ```
- RLS igual al patrón de las demás tablas de eventos (view: usuarios activos, insert/update/delete: responsable o admin)
- Aplicar `audit_trigger` 
- Eliminar columnas `donadora_id`, `receptora_id`, `fecha_transferencia`, `estado_embrion` de `animales`
- Mantener el enum `estado_embrion` (ahora usado solo por la nueva tabla)

**2. Código:**
- `src/integrations/supabase/types.ts` se regenera automáticamente
- No hay UI todavía que use estos campos (Fase B no se ha construido), así que no hay refactor de componentes pendiente

### Resultado final
La tabla `animales` queda limpia con solo datos de identidad: `codigo`, `nombre`, `tipo`, `sexo`, `fecha_nacimiento`, `numero_registro`, `color`, `raza`, `finca_id`, `madre_id`, `padre_id`, `foto_principal_url`, `activo`, timestamps.

Toda la lógica específica de embriones queda en `embriones_detalle`, consistente con cómo `vacunaciones`, `partos`, etc. tienen sus propias tablas.

