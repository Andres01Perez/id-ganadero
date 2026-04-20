

## Selección nativa de foto: cámara o galería

### Problema
En `AnimalForm.tsx` (y probablemente `FincaForm.tsx`) el input de foto tiene:
```tsx
<input type="file" accept="image/*" capture="environment" ... />
```

El atributo `capture="environment"` **fuerza** al sistema a abrir directamente la cámara trasera en mobile, sin dar la opción de elegir de la galería. Es comportamiento no-estándar para apps de gestión donde el usuario puede tener fotos previas.

### Solución estándar de la industria

Quitar `capture="environment"` del input. Sin ese atributo, el sistema operativo muestra **automáticamente** su selector nativo:
- **iOS**: hoja de acción con "Tomar foto", "Fototeca", "Elegir archivo"
- **Android**: selector con "Cámara", "Galería", "Archivos"

Esto es exactamente el patrón que usan WhatsApp, Instagram, Telegram, etc. Es la respuesta nativa correcta — no hay que construir UI custom, el OS la provee.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/AnimalForm.tsx` | Quitar `capture="environment"` del `<input type="file">` (línea ~310 aprox.). Mantener `accept="image/*"` para filtrar solo imágenes. |
| `src/components/FincaForm.tsx` | Verificar y aplicar el mismo cambio si tiene el mismo input con `capture`. |

### Detalle técnico
- `accept="image/*"` se mantiene → el OS sigue filtrando solo fotos.
- Sin `capture` → el OS decide; en mobile muestra hoja de acción nativa, en desktop abre el file picker normal.
- No se necesita JS adicional, no se necesitan permisos extra, no se rompe nada.
- El flujo de `resizeImage` + upload a Supabase Storage sigue idéntico — solo cambia cómo el usuario elige la imagen.

### Por qué no hacer un menú custom
Construir un dropdown "Cámara / Galería" con dos inputs separados (uno con `capture`, otro sin) añade complejidad innecesaria y se siente menos nativo que la hoja de acción del propio OS. El estándar moderno es delegar al sistema.

