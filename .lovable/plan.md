## Cambios

**1. Migración SQL**
```sql
ALTER TABLE public.potreros ADD COLUMN hectareas numeric;
```
Nullable para no romper potreros existentes.

**2. `src/components/PotreroForm.tsx`**
- Agregar estado `hectareas` (string para input).
- Schema zod: `hectareas: z.string().optional()` con refine para número positivo ≤ 99999.
- Cargar `data.hectareas` en edición.
- Incluir `hectareas` en INSERT y UPDATE (parseFloat o null).
- Nuevo input numérico (`type="number"`, `step="0.01"`, `min="0"`) entre Número y Estado.

**3. `src/pages/finca/Potreros.tsx`** (revisar si muestra info en la lista)
- Si la lista muestra detalles del potrero, agregar las hectáreas como dato secundario (ej. "12 ha").

No se cambian RLS — la columna hereda las políticas existentes de la tabla.
