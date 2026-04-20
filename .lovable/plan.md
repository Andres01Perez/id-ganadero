

## Modelo multi-finca con visibilidad por operario

### Concepto

Un operario pertenece a una o varias fincas. Solo ve y gestiona los animales de **sus fincas asignadas**. Admin/super_admin siguen viendo todo.

```text
┌──────────┐     ┌────────────────────┐     ┌────────┐
│ profiles │────<│ user_finca_acceso  │>────│ fincas │
└──────────┘     └────────────────────┘     └────────┘
                                                 │
                                                 │
                                            ┌────┴─────┐
                                            │ animales │  (finca_id NOT NULL)
                                            └──────────┘
```

---

### 1. Cambios en base de datos (migración)

**Nueva tabla `user_finca_acceso`** (la fuente única de verdad para "este usuario pertenece a estas fincas"):

| Columna | Tipo |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid → profiles.id |
| `finca_id` | uuid → fincas.id |
| `created_at` | timestamptz |
| `created_by` | uuid |

UNIQUE `(user_id, finca_id)`. RLS: super_admin/admin gestionan; operario puede ver sus propias filas.

**Función security definer `user_has_finca(_user_id, _finca_id)`** → bool. Devuelve true si:
- Es admin/super_admin (acceso global), **o**
- Tiene fila en `user_finca_acceso` para esa finca.

**`animales.finca_id` → NOT NULL**: antes de aplicar el constraint, los animales huérfanos (sin finca) quedan visibles solo para admins. Plan: la migración detecta si hay filas con `finca_id IS NULL` y las deja como están temporalmente, pero el constraint NOT NULL solo se aplica si no quedan huérfanos. Si los hay, se notifica y se pide al admin asignarlos manualmente desde la UI antes de reintentar el constraint. **Decisión simple**: la migración añade el constraint solo si no hay huérfanos; si los hay, deja la columna nullable y un comentario en el schema. La RLS nueva ya excluye huérfanos para operarios sin importar el constraint.

**Reescribir RLS de `animales`**:

| Acción | Política nueva |
|---|---|
| SELECT | `is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id)` |
| INSERT | activo + (admin/super_admin **o** `user_has_finca` para la `finca_id` que envía) + `created_by = auth.uid()` |
| UPDATE | admin/super_admin **o** `user_has_finca(auth.uid(), finca_id)` (ya no exige ser creador) |
| DELETE | igual a UPDATE |

**Tablas de eventos** (`pesajes`, `vacunaciones`, `medicaciones`, `palpaciones`, `partos`, `inseminaciones`, `chequeos_veterinarios`, `ciclos_calor`, `dietas`, `aspiraciones`, `embriones_recolectados`, `embriones_detalle`):
Cambiar SELECT/INSERT/UPDATE/DELETE para validar acceso vía el `animal_id` del evento — política tipo:
```
EXISTS (SELECT 1 FROM animales a WHERE a.id = animal_id 
        AND (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), a.finca_id)))
```

---

### 2. Cambios en frontend

**`AnimalForm.tsx`**:
- `finca_id` → **obligatorio** (validación zod, asterisco rojo, sin opción "Sin asignar"). 
- En modo crear: si el usuario es operario, el select solo lista sus fincas asignadas. Si es admin, lista todas.
- Selects de madre/padre ya filtran activos; siguen igual (la RLS garantiza que solo verá madres/padres de sus fincas).

**`FincaForm.tsx`** (nuevo bloque):
- Nueva sección "Operarios asignados" visible solo para admin/super_admin.
- Lista checkboxes de operarios; al guardar, sincroniza `user_finca_acceso` (insert/delete diff).

**`Admin.tsx` → tab "Usuarios"**:
- Tras crear el operario, mostrar paso 2: "Asignar a fincas" con checkboxes de fincas activas. Inserta en `user_finca_acceso`.
- Nueva sub-sección **"Operarios existentes"**: lista de operarios con sus fincas actuales y botón para editar asignaciones (modal con checkboxes).

**`CategoriaAnimales.tsx`**, **`HojaVidaAnimal.tsx`**, **`SearchDialog.tsx`**: sin cambios — la RLS hace todo el filtrado automáticamente. Si la lista llega vacía para un operario sin fincas asignadas, mostramos mensaje "No tienes fincas asignadas. Pide a un admin que te asigne una."

**`Fincas.tsx`**: en cada tarjeta mostrar pequeño badge con conteo de operarios asignados (solo visible para admin).

---

### 3. Edge function `admin-create-user`

Aceptar parámetro opcional `finca_ids: string[]`. Tras crear el usuario y asignar rol, si rol = operario y hay finca_ids → insertar filas en `user_finca_acceso`. Si falla → rollback completo.

---

### 4. Migración de datos existentes

Para no romper nada:
- Animales con `finca_id IS NULL` → quedan visibles solo para admin (la nueva RLS los excluye para operarios automáticamente). Aviso visual en `Admin.tsx`: "N animales sin finca, asígnalos".
- Operarios existentes → quedan sin fincas asignadas hasta que el admin los configure. La UI muestra el mensaje "Pide a un admin que te asigne una finca."

---

### Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear `user_finca_acceso` + `user_has_finca()` + reescribir RLS de `animales` y 12 tablas de eventos |
| `supabase/functions/admin-create-user/index.ts` | Aceptar `finca_ids`, insertar accesos |
| `src/components/AnimalForm.tsx` | Finca obligatoria, filtrar fincas según usuario |
| `src/components/FincaForm.tsx` | Sección "Operarios asignados" (admin) |
| `src/pages/Admin.tsx` | Asignar fincas al crear operario; sección operarios existentes |
| `src/pages/CategoriaAnimales.tsx` | Mensaje vacío si no tiene fincas |
| `src/pages/Fincas.tsx` | Badge de operarios por finca (admin) |

### Notas técnicas
- `user_has_finca` usa `SECURITY DEFINER` para evitar recursión en RLS.
- El cliente NO necesita filtrar por finca explícitamente — toda la separación la impone Postgres vía RLS, mucho más seguro.
- `SearchDialog` automáticamente respeta visibilidad porque usa el mismo cliente autenticado.
- Las fincas siguen siendo visibles para todos los autenticados (políticas actuales) — esto está bien porque los operarios necesitan ver al menos los nombres de sus fincas asignadas en los selects.

