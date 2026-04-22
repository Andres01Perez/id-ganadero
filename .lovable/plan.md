

## CRUD completo en el panel de Super Admin

### Objetivo
Desde `/superadmin`, el usuario con rol `super_admin` debe poder administrar directamente:

- Fincas
- Machos
- Hembras
- Crías
- Embriones

Sin tener que entrar a las vistas móviles ni usar el panel admin normal. El superadmin tendrá una vista de gestión centralizada con crear, ver, editar, desactivar y reactivar registros.

---

## 1. Nueva sección en el panel: “Gestión”

### Archivo
`src/pages/SuperAdmin/Layout.tsx`

### Cambio
Agregar una nueva opción al menú lateral:

```text
Gestión
```

Ruta:

```text
/superadmin/gestion
```

Esta será la pantalla principal para manejar fincas y animales.

El menú quedaría así:

```text
Resumen
Gestión
Usuarios
Imágenes
Información finca
Cerrar sesión
```

---

## 2. Nueva página de CRUD

### Archivo nuevo
`src/pages/SuperAdmin/Gestion.tsx`

### Estructura visual
Crear una página con tabs:

```text
Fincas | Machos | Hembras | Crías | Embriones
```

Cada tab tendrá:

- Botón “Agregar”
- Tabla de registros
- Buscador simple por código/nombre
- Filtro de estado:
  - Activos
  - Inactivos
  - Todos
- Acciones por fila:
  - Editar
  - Desactivar
  - Reactivar, cuando el registro esté inactivo

---

## 3. CRUD de fincas

### Reutilizar
`src/components/FincaForm.tsx`

### Funcionalidad
En el tab “Fincas”:

- Listar todas las fincas, no solo activas.
- Mostrar:
  - Nombre
  - Ubicación
  - Hectáreas
  - Estado
  - Número de operarios asignados
- Botón “Agregar finca” abre `FincaForm` en modo creación.
- Botón “Editar” abre `FincaForm` con `fincaId`.
- Botón “Desactivar” cambia `activo = false`.
- Botón “Reactivar” cambia `activo = true`.

### Ajuste menor en `FincaForm`
Cuando se crea una finca, guardar también:

```ts
created_by: user.id
```

Esto no cambia la seguridad, pero deja trazabilidad correcta.

---

## 4. CRUD de animales por categoría

### Reutilizar
`src/components/AnimalForm.tsx`

### Funcionalidad
En los tabs:

```text
Machos
Hembras
Crías
Embriones
```

cada uno usará el mismo componente de gestión filtrando por `tipo`.

Ejemplo:

```ts
tipo = "macho"
tipo = "hembra"
tipo = "cria"
tipo = "embrion"
```

Cada tabla mostrará:

- Foto
- Código
- Nombre
- Finca
- Sexo
- Raza
- Color
- Fecha nacimiento
- Registro
- Estado
- Acciones

Acciones:

- “Agregar macho/hembra/cría/embrión”
- “Editar”
- “Desactivar”
- “Reactivar”

Crear y editar abrirán `AnimalForm`.

Desactivar será soft delete:

```ts
activo = false
```

Reactivar será:

```ts
activo = true
```

---

## 5. Ajustes en `AnimalForm`

### Archivo
`src/components/AnimalForm.tsx`

### Cambios
Mantener la lógica actual, pero hacerla más útil para superadmin:

1. Asegurar que `super_admin` pueda crear animales en cualquier finca.
2. Mantener que el campo `finca_id` sea obligatorio.
3. Al crear, seguir enviando:

```ts
created_by: user.id
```

4. En modo superadmin/admin, cargar todas las fincas activas para selección.
5. No cambiar el comportamiento de operarios.

La edición seguirá funcionando con el mismo formulario que ya se usa en las vistas móviles.

---

## 6. Ruta nueva

### Archivo
`src/App.tsx`

Agregar dentro del layout protegido de superadmin:

```tsx
<Route path="gestion" element={<SuperAdminGestion />} />
```

La ruta quedará protegida por:

```tsx
<ProtectedRoute requireRoles={["super_admin"]}>
```

igual que el resto del panel.

---

## 7. RLS y seguridad

### Estado actual
Las políticas actuales ya parecen cubrir gran parte del acceso total porque usan:

```sql
is_admin_or_super(auth.uid())
```

En especial:

- `fincas`: admin/super_admin pueden insertar, actualizar y borrar.
- `animales`: admin/super_admin pueden ver, actualizar y borrar cualquier animal.
- `animales insert`: permite insertar si:
  - el usuario está activo,
  - `created_by = auth.uid()`,
  - hay `finca_id`,
  - y el usuario es admin/super_admin o tiene acceso a esa finca.

Como el superadmin cumple `is_admin_or_super`, debería poder crear animales en cualquier finca siempre que el frontend mande `created_by`.

### Verificación antes de tocar BD
Antes de modificar políticas, revisar con linter/schema:

- `fincas`
- `animales`
- `user_finca_acceso`

### Migración solo si hace falta
Si alguna política no permite el CRUD total al superadmin, crear una migración para dejar explícito:

```sql
-- fincas
is_admin_or_super(auth.uid())

-- animales
is_admin_or_super(auth.uid())
OR user_has_finca(auth.uid(), finca_id)
```

No se guardarán roles en `profiles`; se mantiene el modelo seguro con `user_roles` y funciones `SECURITY DEFINER`.

---

## 8. No cambiar

No se cambia:

- Login
- Roles existentes
- Estructura principal de tablas
- `src/integrations/supabase/types.ts`
- Vistas móviles actuales
- Carga de imágenes desde `/superadmin/imagenes`

---

## 9. Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Agregar ruta `/superadmin/gestion` |
| `src/pages/SuperAdmin/Layout.tsx` | Agregar item “Gestión” al menú |
| `src/pages/SuperAdmin/Gestion.tsx` | Nueva página CRUD para fincas y animales |
| `src/components/FincaForm.tsx` | Guardar `created_by` al crear finca |
| `src/components/AnimalForm.tsx` | Ajustes menores para uso completo desde superadmin |
| `supabase/migrations/...sql` | Solo si al verificar RLS falta alguna política |

---

## 10. Verificación

1. Entrar como superadmin a `/superadmin`.
2. Abrir “Gestión”.
3. Crear una finca nueva.
4. Editar la finca.
5. Desactivar y reactivar la finca.
6. Crear un macho asignado a una finca.
7. Crear una hembra asignada a una finca.
8. Crear una cría asignada a una finca.
9. Crear un embrión asignado a una finca.
10. Editar cada animal.
11. Desactivar y reactivar cada animal.
12. Confirmar que los animales activos aparecen en sus vistas móviles.
13. Confirmar que los inactivos no aparecen en las vistas móviles, pero sí en superadmin cuando el filtro está en “Inactivos” o “Todos”.

