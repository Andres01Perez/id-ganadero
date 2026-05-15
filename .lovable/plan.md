## Problema encontrado

La tabla `empleados` ya tiene una política para que `admin` y `super_admin` puedan crear empleados. También confirmé que los usuarios existentes sí tienen esos roles activos.

El bloqueo viene de la forma en que se crea el empleado:

1. Primero se inserta en `empleados`.
2. Después se inserta la relación en `empleado_fincas`.

Eso deja una validación incompleta durante el primer paso: el empleado todavía no está asociado a una finca cuando se crea. Además, si se está usando un admin que no tiene fila en `user_finca_acceso`, algunas políticas dependientes de finca pueden quedar inconsistentes.

## Cambio propuesto

### 1. Crear una función segura en Supabase
Crear una función `public.create_empleado_with_finca(...)` con `SECURITY DEFINER` que haga la operación completa de forma atómica:

- Validar que el usuario actual sea `admin` o `super_admin`.
- Crear el registro en `empleados`.
- Crear inmediatamente la relación en `empleado_fincas` con la finca seleccionada.
- Devolver el `id` del empleado creado.

Esto evita el error de RLS porque la creación del empleado y su asociación a la finca ocurren juntas, desde una función controlada por la base de datos.

### 2. Ajustar RLS de `empleados`
Mantener la seguridad:

- Solo `admin` y `super_admin` pueden crear/editar/eliminar empleados.
- Los empleados se siguen viendo únicamente desde fincas permitidas.
- No se abre la tabla a usuarios normales.

### 3. Cambiar `EmpleadoForm.tsx`
En creación nueva:

- Reemplazar la inserción manual en `empleados` + `empleado_fincas` por una llamada a la función `create_empleado_with_finca`.
- Mantener igual la edición, subida de foto y actualización de `foto_url`.

### 4. Validación final
Probar el flujo con:

- Usuario `super_admin` (`admin1`).
- Usuario `admin` (`Jorge Perez`).

Resultado esperado:

- Crear empleado no debe mostrar `new row violates row-level security policy for table "empleados"`.
- El empleado queda asociado a la finca activa.
- La lista de empleados de esa finca lo muestra correctamente.

## Nota importante

No voy a permitir creación de empleados a operarios ni a usuarios sin rol administrativo. La corrección mantiene el control administrativo y solo soluciona el bloqueo de RLS.