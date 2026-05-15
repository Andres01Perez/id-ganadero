## Cambios

### 1. Base de datos (migración)

**Nueva tabla `animal_genealogia`** — un registro por archivo subido:
- `id uuid pk`
- `animal_id uuid` (referencia al animal)
- `file_url text` (URL pública)
- `storage_path text` (ruta dentro del bucket, para borrar)
- `file_name text` (nombre original)
- `mime_type text` (`application/pdf`, `image/jpeg`, etc.)
- `uploaded_by uuid`
- `created_at timestamptz default now()`

**RLS** (siguiendo el patrón existente):
- `SELECT/INSERT`: usuarios activos con acceso a la finca del animal (`user_can_access_animal`).
- `DELETE`: admin/super o el `uploaded_by` original.
- `UPDATE`: no permitido (re-subir).

**Bucket de storage `animal-genealogia` (público, lectura abierta)**:
- Lectura pública (bucket público).
- INSERT: cualquier usuario activo (la app ya restringe por animal en la tabla).
- DELETE: admin/super o dueño del archivo (igual que galería).
- Path convención: `${animal_id}/${timestamp}-${nombre}`.

**Eliminar `campeonatos`**: `DROP TABLE public.campeonatos`. (Los registros existentes se pierden — confirmado por la intención del usuario de eliminar la opción.)

### 2. `src/pages/HojaVidaAnimal.tsx`
- En el array `pills`, reemplazar `{ label: "Campeonatos", slug: "campeonatos" }` por `{ label: "Genealogía", slug: "genealogia" }`.
- Genealogía no usa el flujo `/seguimiento/:tipo`. Cambiar la navegación de esa pill (y solo esa) para ir a `/animal/:id/genealogia`. El resto sigue igual.

### 3. Nueva página `src/pages/AnimalGenealogia.tsx`
Página dedicada (mismo estilo header dorado + back que `Animales.tsx` de finca):

```
[< ] GENEALOGÍA
─────────────────────────
Tarjeta del animal (mini): número, nombre

[ + Subir archivo ]  ← input file accept="image/*,application/pdf", multiple

Lista de archivos:
┌──────────────────────────────────┐
│ [thumb / 📄]  nombre.pdf         │
│               12 nov 2026   [🗑] │
└──────────────────────────────────┘
```

Comportamiento:
- Carga: `select * from animal_genealogia where animal_id = :id order by created_at desc`.
- Subir: por cada archivo seleccionado → `storage.upload` a `animal-genealogia/${animalId}/${Date.now()}-${nombre}` → `getPublicUrl` → `insert` en `animal_genealogia`. Toast de éxito y refresh.
- Vista previa: imágenes como thumbnail cuadrado; PDFs ícono `FileText` dorado. Tap en la fila → abre la URL pública en nueva pestaña.
- Eliminar (botón papelera): visible solo para admin/super o el `uploaded_by`. Borra del bucket por `storage_path` y de la tabla.
- Estado vacío: "Aún no hay documentos de genealogía. Sube el certificado de ASOSEBÚ en PDF o foto."
- Toda la subida y validación queda en frontend; sin lógica de negocio nueva fuera de almacenamiento.

### 4. `src/App.tsx`
- Añadir ruta `/animal/:id/genealogia` → `<AnimalGenealogia />` envuelta en `ProtectedRoute`.

### 5. Limpieza de referencias a `campeonatos`
- `src/lib/seguimiento-config.ts`: quitar entrada `campeonatos` del config y del union `SeguimientoTipo`. Quitar import de `Award` si queda huérfano.
- `src/lib/audit-format.ts`: quitar la entrada `campeonatos: "Campeonato"`.

### 6. Notas
- No hace falta tocar `src/integrations/supabase/types.ts`: se regenera tras la migración.
- No se agrega lógica de inventario, animales ni roles. Permisos completos vía RLS.
