## Cambios

**1. Migración SQL — bucket `finca-fotos`**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('finca-fotos', 'finca-fotos', true);
```
Políticas en `storage.objects`:
- SELECT público (bucket público)
- INSERT/UPDATE/DELETE solo `is_admin_or_super(auth.uid())` y `bucket_id = 'finca-fotos'`

**2. `src/pages/MenuFinca.tsx`**
- Importar `useAuth`, `Pencil` de lucide, `useState`, `useRef`, `supabase`, `toast`, `ImageCropDialog`, `useFinca` (`reloadFincas`).
- Mostrar botón lápiz en `top-3 right-3` del header (mismo estilo que el botón Volver: círculo `bg-black/40 backdrop-blur` con icono blanco), visible solo si `roles.includes('admin') || 'super_admin'`.
- Click → abre `<input type="file" accept="image/*">` oculto.
- Al seleccionar archivo → abre `ImageCropDialog` con `aspect={865/503}` y `outputSize={{width: 1730, height: 1006}}`.
- Al confirmar crop:
  - Subir blob a `finca-fotos/${fincaId}/${Date.now()}.jpg` con `upsert: true`.
  - Obtener `getPublicUrl`.
  - `update fincas set foto_url = url where id = fincaId`.
  - `await reloadFincas()` para refrescar `fincaActiva`.
  - Toast éxito.
- Manejar errores con toast + `console.error`.

**Sin cambios** en otras vistas. Reutiliza patrón de `EmpleadoForm` y `ImageCropDialog` existente.
