# Cierre de Funcionalidad 1 (Empleados) y 2 (Potreros)

Cerramos los 6 puntos pendientes detectados en el análisis previo. Sin tocar el schema de tablas (todos los campos ya existen); solo creamos un bucket de storage para fotos de empleados.

## 1. Storage: bucket `empleado-fotos`

Migración SQL:

- Crear bucket público `empleado-fotos`.
- RLS sobre `storage.objects` para ese bucket:
  - SELECT: cualquier usuario autenticado activo (`is_active_user(auth.uid())`).
  - INSERT/UPDATE/DELETE: solo `is_admin_or_super(auth.uid())`.
- Convención de paths: `{empleado_id}/{timestamp}.jpg`.

## 2. `EmpleadoForm.tsx` — foto + fecha de salida

Cambios al sheet:

- **Foto del empleado** (sección al inicio, igual que `AnimalForm`):
  - Botón cámara → `ImageCropDialog` con aspecto 1:1 (output 512×512).
  - Preview circular con borde dorado.
  - Si no hay foto: icono `User` de lucide centrado.
  - Subida diferida: tras crear/actualizar empleado, sube el blob al bucket `empleado-fotos` y hace `update empleados set foto_url=...`.
- **Fecha de salida** (`fecha_salida`, date input).
- **Toggle Activo/Inactivo** (Switch):
  - Si pasa de activo→inactivo y `fecha_salida` está vacía, prefilla con hoy (editable).
  - Si pasa a activo de nuevo, `fecha_salida` se limpia.
- Reemplazar el botón "Desactivar" por el toggle (más explícito); mantener botón rojo "Eliminar definitivamente" solo para super_admin (opcional, fuera de alcance — no se incluye, queda solo el toggle).
- Validar con `zod`: `fecha_salida` opcional, debe ser ≥ `fecha_ingreso` si ambas existen.

## 3. `pages/finca/Empleados.tsx` — mostrar inactivos + edad + cumpleaños + icono

- Quitar el filtro `.eq("activo", true)` para traer también inactivos.
- Ordenar: activos primero, luego inactivos, ambos por nombre.
- Tarjeta de empleado:
  - Avatar: si `foto_url` → imagen; si no → círculo dorado con icono `User` (lucide), reemplazando las iniciales actuales.
  - Línea secundaria: `CC {cedula} · {edad} años{ · 🎂 hoy?}`.
  - Helper `calcularEdad(fechaNac)` y `esCumpleHoy(fechaNac)` en `src/lib/empleado-utils.ts`.
  - Badge dorado pequeño "🎂 ¡Cumpleaños hoy!" cuando aplique.
  - Si `activo === false`: aplicar `opacity-40 grayscale` a toda la tarjeta + badge "Inactivo" en gris.
- El buscador sigue filtrando por nombre/cédula en el conjunto completo (activos + inactivos).

## 4. Detalles técnicos

- Reutilizar `ImageCropDialog` existente (mismo patrón que `AnimalForm`).
- Helper de upload reutilizado en `EmpleadoForm` (función local `uploadFoto(empleadoId, blob)`).
- Tipos: el campo `foto_url` ya existe en `empleados`; no requiere cambio en `types.ts`.
- Tema: black + gold, mobile-first, sin colores hardcoded (tokens del design system).
- Accesibilidad: `aria-label` en botones de cámara y toggle.

## Fuera de alcance (lo dejamos para después)
- Notificaciones de cumpleaños del día en el menú principal.
- Historial de cambios de estado del empleado.
- Vincular empleado ↔ usuario auth (`empleados.user_id` ya existe pero la UI de vinculación se hará en el panel super-admin).

## Resultado esperado
Funcionalidad 1 (Empleados) y 2 (Potreros) quedan 100% según el spec, listas para pasar a las siguientes 3 funcionalidades.
