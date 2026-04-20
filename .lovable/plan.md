

## CRUDs y vistas interiores: Fincas, Machos, Hembras, Crías, Embriones

### Alcance
- **Listas**: misma presentación visual (foto circular, nombre, código) para machos, hembras, crías, embriones. Fincas reutiliza la estética pero con campos propios (no es animal).
- **CRUD completo**: crear, editar y desactivar (soft-delete via `activo=false`) para los 5 recursos.
- **Foto principal**: subir desde el formulario (mismo flujo que Admin: resize 800×800 → bucket `animal-fotos`).
- **"Otros"**: queda intacto como placeholder.

---

### 1. Componente reutilizable: formulario de animal

**Crear `src/components/AnimalForm.tsx`**
Modal sheet (usa `Sheet` de shadcn) que recibe `tipo` y `animalId?` (si viene → edita, si no → crea).

Campos según tabla `animales`:

| Campo | Input | Notas |
|---|---|---|
| `codigo` | text obligatorio | único en la práctica |
| `nombre` | text | opcional |
| `numero_registro` | text | opcional |
| `fecha_nacimiento` | date | opcional |
| `sexo` | select M/H | autollenado: macho→M, hembra→H, oculto en esos casos; visible solo en cría y embrión |
| `raza` | text | opcional |
| `color` | text | opcional |
| `finca_id` | select | trae fincas activas |
| `madre_id` | select buscable | solo hembras activas |
| `padre_id` | select buscable | solo machos activos |
| `foto` | file (cámara) | opcional, sube tras crear |

Validación con `zod`. Submit:
- Insert/update en `animales` con `created_by = auth.uid()` y `tipo` recibido.
- Si hay foto → resize + upload a `animal-fotos/{id}/{timestamp}.jpg` → update `foto_principal_url`.

### 2. Componente reutilizable: formulario de finca

**Crear `src/components/FincaForm.tsx`**
Mismo patrón Sheet con `nombre` (obligatorio), `ubicacion`, `hectareas` (numérico).

### 3. Página Fincas con CRUD

**Reemplazar `src/pages/PlaceholderPage` para ruta `/fincas`** → crear `src/pages/Fincas.tsx`
- Header foto + banda dorada "FINCAS" (mismo patrón que `CategoriaAnimales`).
- Lista de fincas: tarjeta con icono dorado, nombre, ubicación + hectáreas debajo.
- Tap en tarjeta → abre `FincaForm` en modo edición.
- FAB `+` → abre `FincaForm` en modo creación.
- Botón eliminar dentro del form (soft via `activo=false`).
- Actualizar `App.tsx`: ruta `/fincas` apunta a `<Fincas />`.

### 4. Conectar CRUD en `CategoriaAnimales.tsx`

- FAB `+` (ya existe, hoy hace `toast.info`) → abre `<AnimalForm tipo={validTipo} />`.
- Al cerrar con éxito → recarga lista.
- Long-press o swipe ya no, mantenemos simple: tap normal → `/animal/:id`.

### 5. Editar desde Hoja de vida

**`HojaVidaAnimal.tsx`**: añadir botón "Editar" pequeño en la esquina superior derecha del header (junto al back), con icono `Pencil`. Abre `<AnimalForm tipo={animal.tipo} animalId={id} />` en modo edición. Al guardar, recarga datos.

### 6. Permisos

Las RLS ya están bien:
- Cualquier usuario activo puede insertar animales (`created_by = auth.uid()`).
- Solo el creador o admin puede editar/borrar.
- Fincas: solo admin/super_admin manejan (insert/update/delete). El form de fincas debe **ocultar el FAB y deshabilitar edición** si el usuario no es admin → mostrar lista en modo lectura.

### 7. Búsqueda en SearchDialog (mejora menor)

Como ya tenemos formularios y datos reales, conectar la sección "Animales" del `SearchDialog` a `animales` (query con `ilike` sobre `codigo` y `nombre`, limit 8). Navegar a `/animal/:id` al seleccionar. Esto cierra el círculo: crear → buscar → ver.

---

### Archivos

| Archivo | Cambio |
|---|---|
| `src/components/AnimalForm.tsx` | **Crear**. Sheet con form completo, zod, foto, padres/madres, finca. |
| `src/components/FincaForm.tsx` | **Crear**. Sheet con nombre/ubicacion/hectareas. |
| `src/pages/Fincas.tsx` | **Crear**. Lista + CRUD con misma estética. |
| `src/pages/CategoriaAnimales.tsx` | Conectar FAB `+` al `AnimalForm`. |
| `src/pages/HojaVidaAnimal.tsx` | Añadir botón "Editar" que abre `AnimalForm`. |
| `src/components/SearchDialog.tsx` | Conectar sección Animales a query real de Supabase. |
| `src/App.tsx` | Cambiar ruta `/fincas` de `PlaceholderPage` a `Fincas`. |

### Notas técnicas
- Reutilizo `resizeImage()` extrayéndolo a `src/lib/image.ts` para no duplicar código entre `AnimalForm` y `Admin.tsx`.
- Los selects de madre/padre filtran por `tipo='hembra'` y `tipo='macho'` respectivamente, ordenados por `codigo`.
- "Otros" (`/generalidades`) sigue siendo `PlaceholderPage` — no se toca.
- La sección de eventos (pills) en hoja de vida sigue como placeholder; el CRUD de eventos (calor, partos, etc.) es trabajo futuro.

