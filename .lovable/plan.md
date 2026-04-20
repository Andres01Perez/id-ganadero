

## Eliminar opción "Restaurar" en /superadmin/imagenes

### Cambios

**`src/components/AssetDropzone.tsx`**
- Eliminar la función `reset()` completa.
- Eliminar el botón "Restaurar" del header de la tarjeta (junto con el icono `RotateCcw`).
- Eliminar el import de `RotateCcw` de `lucide-react`.
- Mantener el indicador "Personalizada · {assetKey}" al pie para que el superadmin sepa que hay un override activo.

### Sin cambios
- No se borran registros existentes en `app_assets` ni archivos del bucket `app-assets`. Si en el futuro hace falta limpiar storage, se hace manualmente desde el dashboard de Supabase.
- No se toca BD, RLS, ni edge functions.

### Verificación
1. Entrar a `/superadmin/imagenes`.
2. Comprobar que ninguna tarjeta muestra el botón "Restaurar", incluso las que ya tienen imagen personalizada.
3. Subir una imagen nueva sigue funcionando igual (con el modal de recorte).

