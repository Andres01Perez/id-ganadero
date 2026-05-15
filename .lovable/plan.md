## Problema

`empleados` y otras tablas relacionadas con `/menu-finca` tienen políticas RLS inconsistentes. Algunas exigen `user_has_finca` incluso para admins, otras requieren que el `responsable_id` o `created_by` sea exactamente `auth.uid()` sin permitir override de admin. Esto bloquea operaciones legítimas de admin/super_admin.

Verificado en BD:
- Ambos admins (`admin1` super_admin y `Jorge Perez` admin) tienen `profiles.active = true`.
- Jorge **no tiene filas en `user_finca_acceso`**. `user_has_finca` lo permite porque `is_admin_or_super` corta el OR. Pero esa dependencia es frágil y mezcla privilegio con pertenencia.

## Auditoría de tablas de `/menu-finca`

| Tabla | INSERT | UPDATE | DELETE | Riesgo |
|---|---|---|---|---|
| `empleados` | admin | admin | admin | OK estructura, posible falla por trigger faltante de `created_by` |
| `empleado_fincas` | admin + user_has_finca | — (sin UPDATE) | admin | OK |
| `fincas` | admin | admin | admin | OK |
| `potreros` | active + user_has_finca | user_has_finca | user_has_finca | Admin sin acceso a finca depende de short-circuit |
| `animales` | active + created_by=uid | active | active | OK pero global, no por finca |
| `animales_finca` | active + user_has_finca | user_has_finca | user_has_finca | Igual que potreros |
| `inventario_productos` | active + created_by + user_has_finca | user_has_finca | user_has_finca | Igual |
| `inventario_movimientos` | active + responsable_id=uid + producto accesible | producto accesible | producto accesible | OK |
| `galeria_fotos` | active + subido_por=uid + user_has_finca | — | dueño o admin | OK |

## Cambios propuestos (migración SQL)

**1. Normalizar override de admin en TODAS las políticas de escritura** de las tablas de `/menu-finca`. Patrón:

```sql
-- Ejemplo para potreros INSERT
DROP POLICY "insert potreros by finca" ON public.potreros;
CREATE POLICY "insert potreros by finca"
  ON public.potreros FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_super(auth.uid())
    OR (is_active_user(auth.uid()) AND user_has_finca(auth.uid(), finca_id))
  );
```

Aplicar mismo patrón a INSERT/UPDATE/DELETE de:
- `potreros`
- `animales_finca`
- `inventario_productos`
- `inventario_movimientos` (vía `producto_id`)
- `galeria_fotos`
- `empleado_fincas` (ya está bien, dejar)
- `empleados` (ya está bien, dejar)

**2. SELECT también con override de admin** en las mismas tablas, para que un admin pueda ver datos de cualquier finca aunque no esté en `user_finca_acceso`:

```sql
DROP POLICY "view potreros by finca" ON public.potreros;
CREATE POLICY "view potreros by finca"
  ON public.potreros FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));
```

**3. `fincas` SELECT** actualmente exige `user_has_finca(auth.uid(), id)`. Aunque el helper ya cubre admin por short-circuit, lo hago explícito:

```sql
DROP POLICY "Authenticated can view fincas" ON public.fincas;
CREATE POLICY "Authenticated can view fincas"
  ON public.fincas FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR (is_active_user(auth.uid()) AND user_has_finca(auth.uid(), id)));
```

**4. Diagnóstico adicional para empleados**: dado que la política actual ya permite a Jorge crear empleados, el error reportado podría venir de otro lado (ej. el insert posterior a `empleado_fincas` cuando el admin no tiene la finca activa cargada). Después de aplicar el override, revalidaremos.

## Lo que no se cambia

- Reglas de `responsable_id = auth.uid()` en eventos médicos (vacunaciones, pesajes, etc.) — son de auditoría y se mantienen.
- Roles en `user_roles` — siguen restringidas a super_admin.
- Lógica del frontend — solo cambia BD.

## Verificación post-migración

1. Ejecutar `supabase--linter` para confirmar que no quedan warnings nuevos.
2. Probar como Jorge: crear empleado, crear potrero, crear producto inventario en una finca a la que no está vinculado.
3. Si el error original persiste tras la migración, pediré al usuario el mensaje exacto de la consola para investigar más.
