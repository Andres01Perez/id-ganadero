

## Plan: Notificación de actualización PWA

### Qué se hará
Cuando el service worker detecte una nueva versión de la app, se mostrará una tarjeta/banner flotante informando al usuario que hay una actualización disponible, con un botón para recargar la app con la nueva versión.

### Cambios

1. **Crear componente `src/components/PwaUpdatePrompt.tsx`**
   - Usa `registerSW` de `virtual:pwa-register` para detectar actualizaciones
   - Muestra un banner fijo en la parte inferior con fondo negro, borde dorado, texto "Nueva actualización disponible" y botón "Actualizar" en dorado
   - Al hacer clic en "Actualizar", llama a `updateServiceWorker(true)` que recarga la app con la nueva versión

2. **Modificar `src/App.tsx`**
   - Importar y renderizar `<PwaUpdatePrompt />` dentro del layout principal

### Archivos
- `src/components/PwaUpdatePrompt.tsx` — nuevo componente
- `src/App.tsx` — agregar el componente

