

## Arreglar selector nativo en móvil

### Causa del problema
El `<select>` nativo dentro de un Radix `Sheet` (que usa `Dialog` por debajo) tiene dos problemas conocidos en móvil:

1. **No abre / clic bloqueado**: Radix Dialog aplica `pointer-events: none` al body y a veces interfiere con el dropdown nativo del sistema (especialmente iOS Safari y algunos Android).
2. **Desfase visual**: El `<select>` nativo en móvil abre una hoja del SO posicionada según el viewport, pero el `Sheet` cambia el scroll y hace que el dropdown aparezca corrido.

Esto pasa porque el Radix Dialog "atrapa" el foco y los eventos táctiles, y el `<select>` nativo no es un componente Radix-aware.

### Solución simple y nativa
Reemplazar el `<select>` nativo por el componente **`Select` de shadcn/Radix** (`src/components/ui/select.tsx`) que ya existe en el proyecto. Está diseñado para funcionar dentro de Dialogs/Sheets sin conflictos:
- Usa `Portal` propio que respeta el stacking del Sheet.
- Maneja correctamente los eventos táctiles en móvil.
- Posicionamiento `popper` automático sin desfases.
- Look consistente con el resto del modal (no usa el dropdown del SO).

### Cambios en `src/pages/Index.tsx`

1. Importar `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` desde `@/components/ui/select`.
2. Reemplazar el `<select>...<option>` (líneas ~102-115) por:

```tsx
<Select value={selectedId} onValueChange={setSelectedId} disabled={loadingUsers}>
  <SelectTrigger className="w-full h-12 rounded-lg bg-neutral-900 text-gold-soft text-base px-3 border border-gold/40 focus:border-gold focus:ring-2 focus:ring-gold/30">
    <SelectValue placeholder={loadingUsers ? "Cargando..." : "— Selecciona tu nombre —"} />
  </SelectTrigger>
  <SelectContent className="bg-neutral-900 border-gold/40 text-gold-soft z-[60]">
    {users.map((u) => (
      <SelectItem key={u.id} value={u.id} className="focus:bg-gold/20 focus:text-gold">
        {u.display_name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

3. `z-[60]` para asegurar que el dropdown quede por encima del Sheet (que usa z-50).

### Resultado
- Tap funciona perfecto en móvil (iOS y Android).
- Sin desfase: el dropdown se abre justo debajo del trigger.
- Estética consistente con el modal negro/dorado.
- Sin cambios en la lógica (`selectedId`, `handleLogin`, etc.).

### Archivo
| Archivo | Cambio |
|---|---|
| `src/pages/Index.tsx` | Reemplazar `<select>` nativo por componente `Select` de shadcn |

