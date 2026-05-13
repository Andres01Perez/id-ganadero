## Cambios

### 1. Cambio de icono "Otros" → "Galería"
- Copiar `user-uploads://ID_GANADERO_camara_1.webp` a `src/assets/menu-finca/galeria.webp`.
- En `src/pages/MenuFinca.tsx`:
  - Reemplazar import `imgOtros` por `imgGaleria`.
  - Cambiar el sexto item: label `"Galería"`, `image: imgGaleria`, `to: \`/finca/${fincaId}/galeria\``, quitar `disabled`.

### 2. Nueva página `/finca/:fincaId/galeria`
- Crear `src/pages/finca/Galeria.tsx`, montar ruta en `src/App.tsx` envuelta con `RequireFinca`.
- Layout coherente con otras páginas de finca: `FincaActivaChip`, header con título "Galería", `BottomTabBar`.
- Tres acciones (botones grandes, mobile-first):
  1. **Tomar foto** → `<input type="file" accept="image/*" capture="environment">` (abre cámara nativa en móvil).
  2. **Subir desde galería** → `<input type="file" accept="image/*" multiple>` (selector nativo, permite múltiple).
  3. (En desktop ambos inputs funcionan como file picker estándar.)
- Cuadrícula tipo masonry/grid 3 columnas mostrando todas las fotos de la finca, ordenadas por `created_at desc`.
- Tap sobre una foto → modal lightbox a pantalla completa con botón eliminar (visible solo si el usuario es el que la subió o es admin/super_admin).
- Toasts de subida/eliminación, estado de carga por archivo, compresión opcional no incluida (mantener simple).

### 3. Backend (migración Supabase)
- **Bucket** `galeria-finca` (público, igual que `animal-fotos`).
- **Tabla** `galeria_fotos`:
  - `id uuid pk`, `finca_id uuid not null`, `storage_path text not null`, `url text not null`, `subido_por uuid not null`, `created_at timestamptz default now()`.
  - Índice por `(finca_id, created_at desc)`.
- **RLS tabla**:
  - SELECT: `user_has_finca(auth.uid(), finca_id)`.
  - INSERT: `is_active_user(auth.uid()) AND subido_por = auth.uid() AND user_has_finca(auth.uid(), finca_id)`.
  - DELETE: `subido_por = auth.uid() OR is_admin_or_super(auth.uid())`.
  - UPDATE: ninguna (no se edita).
- **RLS storage** sobre bucket `galeria-finca`:
  - Estructura de path: `{finca_id}/{uuid}.{ext}`.
  - SELECT público (bucket público, ya cubierto).
  - INSERT: usuario activo con acceso a la finca (`user_has_finca` sobre primer segmento del path).
  - DELETE: dueño del archivo (vía join con `galeria_fotos.subido_por`) o admin.

### 4. Detalles técnicos
- Uso de `supabase.storage.from('galeria-finca').upload(...)` seguido de `insert` en `galeria_fotos` con la URL pública.
- Subida en paralelo con `Promise.all`, mostrando spinner por item.
- No se requiere Capacitor: en móvil el `<input type="file" accept="image/*">` ya muestra la hoja nativa "Cámara / Fotos / Archivos"; con `capture="environment"` se fuerza cámara directa.

### Archivos
- nuevo: `src/assets/menu-finca/galeria.webp`
- nuevo: `src/pages/finca/Galeria.tsx`
- editado: `src/pages/MenuFinca.tsx`
- editado: `src/App.tsx`
- nueva migración: tabla `galeria_fotos` + bucket + policies
