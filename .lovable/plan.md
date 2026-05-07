## Cambios solicitados

### 1. Menú principal: "Otros" → "Gestión"

En `src/pages/Menu.tsx`:

- Renombrar el ítem `"Otros"` a `"Gestión"`.
- Cambiar su ruta de `/generalidades` a `/menu-finca`.
- Eliminar el botón inferior "Gestión de finca" (queda redundante).
- Mantener el icono actual (`iconGeneralidades` / `ASSET_KEYS.iconOtros`) como fallback.

### 2. Mostrar siempre la pantalla de fincas

En `src/pages/Fincas.tsx`:

- Eliminar el `useEffect` que auto-selecciona y redirige cuando hay 1 sola finca. El usuario siempre verá la lista y deberá tocarla para entrar.
- `RequireFinca` no se ve afectado: el chip y el contexto siguen funcionando; cuando el usuario toque la finca se navega a `/menu`.

### 3. Animales de finca: tabla propia, no usar `animales` (genéticos)

La tabla `animales_finca` ya existe en Supabase con campos: `nombre`, `tipo_id` → `tipos_animal_finca`, `edad`, `fecha_ingreso`, `fecha_salida`, `notas`, `activo`. Estos son "otros animales" de la finca (caballos, perros, gallinas, etc. si el usuario da click en otros se debe crear el tipo de animal en la tabla de tipos para ser seleccionado por otros), no el ganado de control genético.

Reescribir `src/pages/finca/Animales.tsx`:

- Quitar tabs por sexo/categoría y `AnimalForm` (que es para genética).
- Listar `animales_finca` con join a `tipos_animal_finca` filtrando por `finca_id`.
- Búsqueda por nombre / tipo.
- CRUD completo disponible para **todos los usuarios con acceso a la finca** (admins y operarios). Las RLS actuales de `animales_finca` exigen `is_admin_or_super`, así que se debe **migrar** las policies para permitir insert/update/delete a cualquier usuario con `user_has_finca`.

Crear `src/components/AnimalFincaForm.tsx` (Sheet):

- Campos: `nombre` (req), `tipo_id` (Select de `tipos_animal_finca`, opción para crear nuevo tipo inline si es admin), `edad` (number opt), `fecha_ingreso`, `fecha_salida`, `notas`, switch `activo`.
- Insert con `created_by = auth.uid()` y `finca_id = fincaActiva.id`.

### 4. Potreros: CRUD para operarios

- Migrar RLS de `potreros`: cambiar insert/update/delete de `is_admin_or_super(...) AND user_has_finca(...)` a sólo `user_has_finca(auth.uid(), finca_id)` (con `is_active_user`).
- En `src/pages/finca/Potreros.tsx` quitar la guarda `isAdmin` para mostrar el FAB y permitir abrir el formulario de edición a todos los usuarios con acceso a la finca.

### 5. Eliminar banners en sub-vistas de finca

Quitar el `<header>` con imagen (banner aspect-[865/503]) y reemplazarlo por una barra simple con botón "Volver" + título dorado (`bg-gold-solid`) en:

- `src/pages/finca/Empleados.tsx`
- `src/pages/finca/Potreros.tsx`
- `src/pages/finca/Animales.tsx`
- `src/pages/PlaceholderPage.tsx` (usado por `/finca/inventario`, `/finca/compra`, `/finca/venta`) — verificar y eliminar banner si lo tiene.

Mantener `FincaActivaChip` arriba.

## Migración SQL requerida

```sql
-- animales_finca: permitir CRUD a operarios con acceso a la finca
DROP POLICY "insert animales_finca admin" ON public.animales_finca;
DROP POLICY "update animales_finca admin" ON public.animales_finca;
DROP POLICY "delete animales_finca admin" ON public.animales_finca;

CREATE POLICY "insert animales_finca by finca" ON public.animales_finca
  FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()) AND user_has_finca(auth.uid(), finca_id));
CREATE POLICY "update animales_finca by finca" ON public.animales_finca
  FOR UPDATE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));
CREATE POLICY "delete animales_finca by finca" ON public.animales_finca
  FOR DELETE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));

-- potreros: idem
DROP POLICY "insert potreros admin" ON public.potreros;
DROP POLICY "update potreros admin" ON public.potreros;
DROP POLICY "delete potreros admin" ON public.potreros;

CREATE POLICY "insert potreros by finca" ON public.potreros
  FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()) AND user_has_finca(auth.uid(), finca_id));
CREATE POLICY "update potreros by finca" ON public.potreros
  FOR UPDATE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));
CREATE POLICY "delete potreros by finca" ON public.potreros
  FOR DELETE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));
```

Empleados se mantiene admin-only (no se solicitó cambio).

## Archivos afectados

- **Edit**: `src/pages/Menu.tsx`, `src/pages/Fincas.tsx`, `src/pages/finca/Empleados.tsx`, `src/pages/finca/Potreros.tsx`, `src/pages/finca/Animales.tsx`, `src/pages/PlaceholderPage.tsx`
- **New**: `src/components/AnimalFincaForm.tsx`
- **Migration**: nueva en `supabase/migrations/`