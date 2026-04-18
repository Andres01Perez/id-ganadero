

## Plan: BottomTabBar estilo Instagram con íconos

### Cambios en `src/components/BottomTabBar.tsx`

Reescribir el componente para que cada tab muestre **ícono encima + label debajo** (estilo Instagram/app móvil nativa), manteniendo el tema negro+dorado del proyecto.

**Íconos lucide-react** (no hay íconos exactos de "toro/vaca/cría/embrión", usamos los que mejor representan visualmente):

| Tab | Ícono lucide | Razón |
|---|---|---|
| Machos | `Beef` | Único ícono bovino disponible en lucide |
| Hembras | `Milk` | Asociación visual con vaca lechera/hembra |
| Crías | `Baby` | Representa cría/recién nacido |
| Embriones | `Egg` | Representa embrión/gestación |

**Estructura nueva por tab** (estilo Instagram):
```text
┌──────────┐
│  [icon]  │  ← 22px, color dorado
│ Label    │  ← 10px, uppercase tracking
└──────────┘
```

**Estilo visual**:
- Fondo sigue `bg-black border-t border-gold/40`
- Cada tab: `flex flex-col items-center gap-1 py-2`
- Inactivo: ícono y texto en `text-gold-soft`
- Activo: barra superior dorada de 2px (estilo Instagram) + ícono y texto en `text-gold` (sin fondo blanco completo, más limpio tipo IG)
- Tamaño ícono: 22px (ligeramente más grande para que se sienta como app móvil)
- Label: `text-[10px]` para que quepa cómodo bajo el ícono
- `active:scale-95` para feedback táctil

### Nota
Si prefieres que mantenga el fondo blanco actual cuando está activo (en lugar de la barra superior), lo cambio. La barra superior es lo más cercano al estilo Instagram puro.

