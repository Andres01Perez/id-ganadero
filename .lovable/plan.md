

## Corregir visibilidad de animales por rol y finca

### Diagnóstico confirmado

En la base de datos ya existe la hembra creada desde superadmin:

```text
Número: 683/01
Tipo: hembra
Finca: Villa Paula
Activo: true
Creado por: admin1 / super_admin
```

También existe el operario:

```text
Operario Prueba
Rol: operario
Finca asignada: Villa Paula
Activo: true
```

Y existe el admin:

```text
Jorge Perez
Rol: admin
Activo: true
```

Por negocio, ambos deberían poder ver esa hembra:

- El `operario` porque tiene acceso a Villa Paula.
- El `admin` porque debe tener acceso total a todas las fincas.
- El `super_admin` porque también tiene acceso total.

El problema está en la capa de acceso/visibilidad: hay que reforzar las políticas RLS y ajustar el frontend para no depender de comportamientos ambiguos ni ocultar errores como si fueran listas vacías.

---

## 1. Corregir RLS de `animales`

Crear una migración nueva para reconstruir las políticas de `public.animales` con reglas claras.

### Regla de lectura

```text
Puede ver animales si:
1. el usuario está activo, y
2. es admin o super_admin
   O
   tiene acceso asignado a la finca del animal.
```

Esto permitirá:

- `super_admin`: ver todos los animales.
- `admin`: ver todos los animales.
- `operario`: ver solo animales de sus fincas asignadas.

### Regla de creación

```text
Puede crear animales si:
1. el usuario está activo,
2. created_by = auth.uid(),
3. finca_id no es nulo,
4. es admin/super_admin o tiene acceso a esa finca.
```

Esto mantiene seguridad y permite que el superadmin cree animales para cualquier finca.

### Regla de edición

Agregar `USING` y también `WITH CHECK`.

Esto es importante porque hoy la política de update valida quién puede editar la fila existente, pero no refuerza correctamente que la fila resultante siga quedando en una finca permitida.

```text
Puede actualizar animales si:
1. puede acceder al animal actual,
2. y el resultado actualizado queda en una finca permitida.
```

### Regla de eliminación

```text
Puede eliminar/desactivar animales si:
1. es admin/super_admin,
2. o tiene acceso a la finca del animal.
```

---

## 2. Reforzar funciones de acceso

Actualizar o crear funciones `SECURITY DEFINER` para evitar problemas de RLS circular y mantener una sola fuente de verdad.

### Función para roles

Usar `public.is_admin_or_super(auth.uid())` como autoridad para acceso total.

### Función para acceso por finca

Revisar `public.user_has_finca(_user_id, _finca_id)` para asegurar que:

```text
admin/super_admin => true para cualquier finca
operario => true solo si existe fila en user_finca_acceso
```

### Función para acceso a animal

Revisar `public.user_can_access_animal(_user_id, _animal_id)` para que consulte la finca del animal usando función `SECURITY DEFINER` y no dependa de políticas recursivas.

---

## 3. Corregir RLS de `fincas`

Hoy `fincas` es visible para cualquier usuario activo. Para que el comportamiento sea consistente con los animales, ajustar la lectura así:

```text
admin/super_admin => ve todas las fincas
operario => ve solo sus fincas asignadas
```

Esto evita que un operario vea fincas que no le corresponden y alinea la lógica con `animales`.

---

## 4. Reparar datos existentes si hace falta

Agregar una validación en migración o verificación posterior para confirmar:

```text
animales.finca_id IS NOT NULL
user_finca_acceso contiene la relación operario -> Villa Paula
perfiles activos
roles correctos
```

No se cambiarán datos innecesariamente, pero se verificará que:

- La hembra `683/01` siga asignada a Villa Paula.
- El operario siga asignado a Villa Paula.
- El admin mantenga acceso global por rol.

---

## 5. Mejorar frontend para mostrar errores reales

Actualizar las consultas de animales en:

| Archivo | Ajuste |
|---|---|
| `src/pages/CategoriaAnimales.tsx` | Mostrar error real si Supabase devuelve error, no solo “No hay animales visibles” |
| `src/pages/Admin.tsx` | Mostrar detalle del error cuando el admin no puede cargar animales |
| `src/pages/SuperAdmin/Gestion.tsx` | Mostrar detalle si falla la consulta principal |
| `src/components/AnimalForm.tsx` | Después de guardar, forzar recarga limpia de la lista |

Esto ayudará a diferenciar entre:

```text
No hay animales
```

y

```text
RLS bloqueó la consulta
```

---

## 6. Evitar datos desactualizados por sesión/caché

Después de corregir RLS:

- Forzar `load()` después de crear/editar animales.
- Mantener `.eq("activo", true)` solo en vistas móviles/admin normales.
- En superadmin conservar filtros `Activos`, `Inactivos`, `Todos`.
- Recomendar cerrar sesión y volver a entrar si el navegador tiene una sesión vieja.

No se cambiará la lógica de negocio: los animales inactivos seguirán ocultos para las vistas móviles normales.

---

## 7. Verificación

Probar con los tres roles:

### Superadmin

1. Entrar a `/superadmin/gestion`.
2. Confirmar que ve la hembra `683/01`.
3. Crear otro animal en Villa Paula.
4. Confirmar que aparece inmediatamente en la tabla.

### Admin

1. Entrar con `Jorge Perez`.
2. Ir a `/menu`.
3. Entrar a `Hembras`.
4. Confirmar que ve la hembra `683/01`.
5. Confirmar que puede ver animales de cualquier finca.

### Operario

1. Entrar con `Operario Prueba`.
2. Ir a `/menu`.
3. Entrar a `Hembras`.
4. Confirmar que ve la hembra `683/01`.
5. Confirmar que solo ve animales de Villa Paula.

---

## 8. Resultado esperado

Después del cambio:

```text
super_admin => ve y administra todos los animales
admin       => ve y administra todos los animales
operario    => ve animales activos de sus fincas asignadas
```

La hembra creada desde superadmin en Villa Paula será visible para el operario asignado a Villa Paula y para cualquier admin.

