

## Nuevo menú inferior: 3 acciones

Reemplazar las 4-5 pestañas de categorías por una barra minimalista de 3 elementos:

```text
┌─────────────────────────────────────────┐
│   ☰          [hierro JPS]          🔍   │
│  Menú                              Buscar│
└─────────────────────────────────────────┘
```

### Comportamiento

| Botón | Icono | Acción |
|---|---|---|
| Izquierda | `Menu` (lucide) | Navega a `/menu` |
| Centro | `jps-logo.webp` (hierro) | Navega a `/menu` (atajo a home) |
| Derecha | `Search` (lucide) | Abre un modal de búsqueda |

### Buscador (modal)
Usar el componente `CommandDialog` de shadcn (ya existe en `src/components/ui/command.tsx`) que abre un overlay con input de búsqueda. Contenido inicial:

- **Sección "Menú"**: Fincas, Machos, Hembras, Crías, Embriones, Otros, Admin (si es admin) → cada uno navega a su ruta.
- **Sección "Animales"**: por ahora vacía con texto "Próximamente buscarás animales aquí". Más adelante se conecta a Supabase.

Atajo de teclado opcional: `Cmd/Ctrl+K` para abrir.

### Cambios en archivos

| Archivo | Cambio |
|---|---|
| `src/components/BottomTabBar.tsx` | Reescribir: 3 botones (Menú, hierro central, Buscar). Quitar lógica de tabs activas y rol admin. El centro renderiza `jps-logo.webp` en círculo dorado más grande, ligeramente elevado del baseline. |
| `src/components/SearchDialog.tsx` | **Crear**. CommandDialog con secciones Menú / Animales. Recibe `open` + `onOpenChange`. Lista navegable con teclado y tap. |
| `src/pages/Menu.tsx` | Sin cambios funcionales. La barra ya se renderiza con `fixed={false}` dentro del contenedor del footer — sigue funcionando. Solo desaparecen las tabs viejas. |
| `src/pages/CategoriaAnimales.tsx` | Sin cambios — sigue usando `<BottomTabBar />`. |
| `src/pages/HojaVidaAnimal.tsx` | Sin cambios — sigue usando `<BottomTabBar />`. |

### Detalles visuales (mantienen estética black + gold)
- Fondo: `bg-black` con borde superior `border-gold/40` (igual que ahora).
- Botones laterales: icono `h-6 w-6` color `gold-soft`, label minúsculo `text-[10px] uppercase tracking-[0.18em]` debajo.
- Hierro central: círculo de `h-14 w-14` con `border-2 border-gold`, fondo negro, imagen `object-contain p-2`. Posicionado con `-mt-4` para que sobresalga ligeramente hacia arriba (efecto FAB sutil), sin label de texto.
- Active state al tap: `active:scale-95`.
- Layout: `flex items-end justify-between px-8 py-2` — alineado al baseline para que el centro elevado se vea natural.

### Resultado
Una barra inferior limpia, idéntica en las 3 páginas que la usan (Menu, Categoria, Hoja de vida), con acceso rápido a home, búsqueda global y al menú principal — sin sobrecarga visual de 5 tabs.

