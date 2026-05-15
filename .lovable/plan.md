## Plan

Reescribir las políticas RLS de `empleados` y `empleado_fincas` para que queden limpias y simples:

### `empleados`
- **SELECT**: admin/super_admin O usuario con acceso a alguna finca a la que el empleado pertenece.
- **INSERT / UPDATE / DELETE**: solo admin o super_admin (en cualquier finca).

### `empleado_fincas`
- **SELECT**: admin/super_admin O usuario con acceso a esa finca.
- **INSERT / DELETE**: solo admin o super_admin.

### Ejecución
1. `DROP POLICY` de las 4 políticas actuales en `empleados` y las 3 actuales en `empleado_fincas`.
2. `CREATE POLICY` de nuevo con la lógica de arriba, todas `TO authenticated` y usando las funciones existentes `is_admin_or_super`, `is_active_user` y `user_has_finca`.
3. Sin tocar el código del frontend — `EmpleadoForm.tsx` ya hace los dos inserts en orden correcto (`empleados` → `empleado_fincas`) y eso seguirá funcionando porque admin/super pasa ambas políticas.

### Verificación
- Probar con `super_admin` (admin1) y `admin` (Jorge Perez) crear un empleado en `/finca/:id/empleados`.
- Confirmar que el empleado aparece en la lista de la finca activa.
- Confirmar que un operario sigue sin poder crear/editar/eliminar empleados.