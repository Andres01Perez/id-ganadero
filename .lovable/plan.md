## Cambios en `src/components/AnimalFincaForm.tsx`

### 1. Mover "Otro" al final y mostrarlo siempre
En el `<Select>` de tipos, eliminar la condición `isAdmin` y dejar el ítem `Otro…` visible para todos los usuarios, **después** de mapear los tipos existentes (ya está al final, solo se cambia el texto a "Otro…" y se quita la guarda).

### 2. Crear el tipo en `tipos_animal_finca` desde cualquier operario
- Quitar el bloqueo `if (!isAdmin)` en `handleSubmit`.
- Antes de insertar, buscar si ya existe un tipo con el mismo nombre (case-insensitive) en el array `tipos` y reusar su id; si no existe, hacer `INSERT` y usar el id devuelto.
- El input de "nuevo tipo" se muestra al seleccionar `Otro…` (ya está) y obtiene `autoFocus`.

### 3. Migración de RLS
La policy actual `insert tipos_animal_finca admin` exige `is_admin_or_super`. Para que operarios puedan crear nuevos tipos:

```sql
DROP POLICY "insert tipos_animal_finca admin" ON public.tipos_animal_finca;

CREATE POLICY "insert tipos_animal_finca active user"
  ON public.tipos_animal_finca
  FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()));
```

Las policies de update/delete se mantienen restringidas a admins (sólo admin puede renombrar/eliminar tipos del catálogo global).

## Archivos afectados
- **Edit**: `src/components/AnimalFincaForm.tsx`
- **Migration**: nueva
