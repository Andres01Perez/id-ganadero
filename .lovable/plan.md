

## Buscador en parte superior (estilo Spotlight)

### Problema
El `CommandDialog` actual hereda el centrado de `DialogContent` (`top-[50%] translate-y-[-50%]`), por eso aparece en la mitad de la pantalla. En mobile (390x821) queda incómodo y poco intuitivo.

### Solución
Reemplazar `CommandDialog` por una composición manual con `Dialog` + `DialogContent` con override de posicionamiento. Sin tocar `command.tsx` ni `dialog.tsx` para no afectar otros usos (ej. dropdowns con búsqueda interna).

### Cambio en `src/components/SearchDialog.tsx`

Imports:
- Añadir `Dialog, DialogContent` de `@/components/ui/dialog`.
- Mantener `Command, CommandInput, CommandList, ...` de `@/components/ui/command`.
- Quitar `CommandDialog`.

Estructura nueva:
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent
    className="
      top-[8%] translate-y-0
      max-w-lg w-[calc(100%-2rem)]
      p-0 gap-0 overflow-hidden
      data-[state=closed]:slide-out-to-top-2
      data-[state=open]:slide-in-from-top-2
    "
  >
    <Command className="[&_[cmdk-...]]:..."> {/* mismas clases que CommandDialog */}
      <CommandInput ... />
      <CommandList> ... </CommandList>
    </Command>
  </DialogContent>
</Dialog>
```

Detalles clave:
- `top-[8%] translate-y-0`: posicionado arriba, no centrado vertical. Sobreescribe el `top-[50%] translate-y-[-50%]` del DialogContent base.
- `max-w-lg w-[calc(100%-2rem)]`: ancho cómodo en desktop, con margen lateral de 1rem en mobile.
- `p-0 gap-0 overflow-hidden`: el Command maneja su propio padding.
- Animación de entrada desde arriba (slide-in-from-top) en lugar del zoom centrado.
- Mantengo el `DialogTitle` oculto con `sr-only` para accesibilidad (Radix lo exige).
- Conservo todo el comportamiento actual: atajo Cmd/Ctrl+K, búsqueda debounced de animales, items de menú, sección admin condicional.

### Resultado
El buscador aparece a ~8% del top de la pantalla, ancho cómodo, animación natural desde arriba. Patrón estándar tipo Spotlight/Linear/Raycast.

### Archivo

| Archivo | Cambio |
|---|---|
| `src/components/SearchDialog.tsx` | Reemplazar `CommandDialog` por `Dialog + DialogContent` con posicionamiento superior. Mantener toda la lógica intacta. |

### Pendiente para después
La Opción B del modal de actualización (polling de `version.json` sin service worker) la planeamos en un mensaje aparte cuando me lo pidas.

