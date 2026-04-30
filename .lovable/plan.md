## Login fijo a viewport en móvil (sin scroll)

### Problema

En `/` (página de login `src/pages/Index.tsx`) en móvil, el botón dorado "Iniciar Sesión" puede quedar debajo del fold y obligar a hacer scroll.

### Causa

El contenedor usa `min-h-[100dvh]` (mínimo, no máximo) y la imagen hero está dentro de un `flex-1` sin `min-h-0`. Cuando la imagen tiene proporciones grandes, fuerza la altura del contenedor y empuja el botón fuera del viewport, generando scroll.

### Solución

En `src/pages/Index.tsx`, cambiar el layout para que la pantalla quede **anclada al viewport**:

```text
1. Contenedor raíz: h-[100dvh] (altura exacta) + overflow-hidden.
2. Hero: flex-1 + min-h-0 + relative; la <img> en absolute inset-0
   con object-cover, así nunca empuja el contenedor.
3. Botón "Iniciar Sesión": flex-shrink-0 para que nunca se comprima,
   y padding-bottom con env(safe-area-inset-bottom) para no quedar
   tapado por la barra de gestos en iPhone.
```

Cambios concretos:

```tsx
// Antes
<div className="min-h-[100dvh] w-full flex flex-col bg-black overflow-hidden">
  <div className="flex-1 relative">
    <img src={heroSrc} className="w-full h-full object-cover" ... />
  </div>
  <button className="w-full bg-gold-solid ... py-5 ...">Iniciar Sesión</button>

// Después
<div className="h-[100dvh] w-full flex flex-col bg-black overflow-hidden">
  <div className="flex-1 min-h-0 relative">
    <img src={heroSrc} className="absolute inset-0 w-full h-full object-cover" ... />
  </div>
  <button className="flex-shrink-0 w-full bg-gold-solid ... py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] ...">
    Iniciar Sesión
  </button>
```

### Resultado

- El botón "Iniciar Sesión" siempre visible en la parte inferior, sin scroll.
- La imagen hero se adapta al espacio sobrante (recortando si hace falta) en lugar de empujar el botón.
- Respeta la barra de gestos en iPhone.

### Sin cambios en

- El Sheet/modal de login interno (ya tiene su propio scroll y altura `h-[70dvh]`).
- Comportamiento desktop (sigue funcionando igual; el hero llena la pantalla).

### Archivos que se tocarán

```text
src/pages/Index.tsx
```
