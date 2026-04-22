

## Cambiar `codigo` por `numero` en animales

### Objetivo
Renombrar la columna estándar del ganado de:

```text
animales.codigo
```

a:

```text
animales.numero
```

y actualizar todo el frontend para que use “Número” en formularios, búsquedas, listas, tablas y hoja de vida.

---

## 1. Base de datos

### Crear migración Supabase
Agregar una migración nueva, sin modificar migraciones antiguas, para renombrar la columna existente:

```sql
ALTER TABLE public.animales
RENAME COLUMN codigo TO numero;
```

Esto conserva los datos actuales. Es decir, si hoy un animal tiene:

```text
codigo = 0123
```

después quedará:

```text
numero = 0123
```

### Mantener unicidad
La columna actual `codigo` fue creada como `text NOT NULL UNIQUE`. Al renombrarla a `numero`, Postgres conserva:

- los datos existentes,
- el `NOT NULL`,
- la restricción `UNIQUE`.

Si la restricción queda con nombre antiguo tipo `animales_codigo_key`, opcionalmente se renombrará para claridad:

```sql
ALTER TABLE public.animales
RENAME CONSTRAINT animales_codigo_key TO animales_numero_key;
```

solo si esa constraint existe.

### RLS
No se necesita cambiar RLS porque las políticas actuales de `animales` no dependen de `codigo`. Usan:

- `finca_id`
- `created_by`
- `is_admin_or_super`
- `user_has_finca`
- `user_can_access_animal`

Por tanto, el cambio es estructural y de frontend, no de permisos.

---

## 2. Frontend: formulario de animales

### Archivo
`src/components/AnimalForm.tsx`

### Cambios
Renombrar internamente:

```ts
codigo -> numero
setCodigo -> setNumero
```

Actualizar validación:

```ts
numero: z.string().trim().min(1, "Número obligatorio").max(40)
```

Actualizar payload al guardar:

```ts
numero: parsed.data.numero
```

Actualizar carga en edición:

```ts
setNumero(data.numero ?? "")
```

Actualizar texto visible:

```text
Código * -> Número *
Completa los datos. El código es obligatorio. -> Completa los datos. El número es obligatorio.
Ya existe un animal con ese código -> Ya existe un animal con ese número.
```

Actualizar selector de madre/padre para mostrar:

```text
{numero} · {nombre}
```

---

## 3. Frontend: vistas móviles

### `src/pages/CategoriaAnimales.tsx`
Cambiar:

- tipo `Animal.codigo` por `Animal.numero`
- query:

```ts
.select("id, numero, nombre, foto_principal_url")
.order("numero")
```

- avatar alt y texto visible para mostrar `numero`.

### `src/pages/HojaVidaAnimal.tsx`
Cambiar:

- tipo `codigo` por `numero`
- query:

```ts
.select("id, numero, nombre, tipo, sexo, fecha_nacimiento, numero_registro, color, raza, foto_principal_url")
```

- banda dorada:

```text
Nombre Número
```

- etiqueta en información general:

```text
Código -> Número
```

---

## 4. Frontend: búsqueda global

### Archivo
`src/components/SearchDialog.tsx`

Actualizar búsqueda para usar `numero`:

```ts
.select("id, numero, nombre, tipo")
.or(`numero.ilike.%${q}%,nombre.ilike.%${q}%`)
```

Actualizar textos:

```text
Escribe código o nombre para buscar… -> Escribe número o nombre para buscar…
```

y resultados usando `a.numero`.

---

## 5. Frontend: panel admin y superadmin

### `src/pages/Admin.tsx`
Actualizar listado de animales:

```ts
.select("id, numero, nombre, tipo, foto_principal_url, finca_id")
.order("numero")
```

y mostrar:

```text
{animal.numero} · {animal.tipo}
```

### `src/pages/SuperAdmin/Gestion.tsx`
Actualizar tabla CRUD:

- `AnimalRow.codigo` -> `AnimalRow.numero`
- query:

```ts
.select("id, numero, nombre, tipo, sexo, raza, color, fecha_nacimiento, numero_registro, foto_principal_url, activo, finca_id, fincas(nombre)")
.order("numero")
```

- buscador:

```text
Buscar por nombre o código -> Buscar por nombre o número
```

- encabezado de tabla:

```text
Código -> Número
```

- búsqueda interna por `numero`.

### `src/pages/SuperAdmin/InformacionFinca.tsx`
Actualizar consulta y tabla de información de finca:

```ts
.select("id, numero, nombre, tipo, raza, color, fecha_nacimiento, numero_registro, sexo, foto_principal_url")
.order("numero")
```

y cambiar textos visibles:

```text
Código -> Número
```

---

## 6. Tipos de Supabase

No editar manualmente:

```text
src/integrations/supabase/types.ts
```

Ese archivo representa el schema de Supabase y debe actualizarse mediante la sincronización/generación del proyecto después de aplicar la migración. El código del frontend quedará apuntando a `numero`, que será la columna real tras la migración.

---

## 7. Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/migrations/...sql` | Migración para renombrar `animales.codigo` a `animales.numero` |
| `src/components/AnimalForm.tsx` | Formulario usa `numero`, textos “Número” |
| `src/components/SearchDialog.tsx` | Búsqueda por `numero` |
| `src/pages/CategoriaAnimales.tsx` | Listas móviles muestran `numero` |
| `src/pages/HojaVidaAnimal.tsx` | Hoja de vida muestra `Número` |
| `src/pages/Admin.tsx` | Listado admin usa `numero` |
| `src/pages/SuperAdmin/Gestion.tsx` | CRUD superadmin usa `numero` |
| `src/pages/SuperAdmin/InformacionFinca.tsx` | Información finca usa `numero` |

---

## 8. Verificación

1. Aplicar migración y confirmar que `animales` tiene columna `numero`.
2. Confirmar que los valores existentes se conservaron.
3. Crear un animal nuevo desde mobile y verificar que pide “Número”.
4. Crear un animal nuevo desde `/superadmin/gestion`.
5. Editar un animal existente y verificar que carga el número correctamente.
6. Buscar un animal por número desde el buscador global.
7. Revisar `/categoria/macho`, `/categoria/hembra`, `/categoria/cria`, `/categoria/embrion`.
8. Revisar `/animal/:id` y confirmar que la hoja de vida muestra “Número”.
9. Revisar `/superadmin/gestion` y `/superadmin/finca/:id`.
10. Confirmar que no cambian permisos RLS ni roles.

