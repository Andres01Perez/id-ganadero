

## Ajustar alto de los banners al tamaño real de la imagen

### Datos
- Imagen banner: **865 × 503 px** → ratio **~1.72:1** (alto = 58.15% del ancho).
- Viewport mobile actual: 390 px de ancho → banner ocupa todo el ancho.
- Alto natural a 390 px de ancho = **227 px** (para que la imagen quepa completa sin recortar).

### Estado actual
| Página | Header actual | Alto en px |
|---|---|---|
| `Menu.tsx` | `h-44` | 176 px (recorta arriba/abajo) |
| `CategoriaAnimales.tsx` | `h-36` | 144 px (recorta mucho) |
| `Fincas.tsx` | `h-36` | 144 px (recorta mucho) |

Con `object-cover` la imagen se está recortando porque el alto del header es menor al alto natural proporcional.

### Solución: usar aspect ratio en vez de altura fija

Reemplazar `h-XX` por **`aspect-[865/503]`** en el `<header>`. Así el header siempre tendrá la altura exacta para que la imagen del banner quepa completa, sin importar el ancho del dispositivo (390, 414, 360, etc.).

A 390 px → 227 px de alto.
A 414 px → 240 px de alto.
A 360 px → 209 px de alto.

Mantener `object-cover` (sigue funcionando bien porque ya el contenedor está en proporción exacta — visualmente equivale a `object-contain` sin barras laterales).

### Cambios

| Archivo | Cambio |
|---|---|
| `src/pages/Menu.tsx` | `<header className="relative h-44 overflow-hidden">` → `<header className="relative aspect-[865/503] overflow-hidden">` |
| `src/pages/CategoriaAnimales.tsx` | `<header className="relative h-36 overflow-hidden">` → `<header className="relative aspect-[865/503] overflow-hidden">` |
| `src/pages/Fincas.tsx` | `<header className="relative h-36 overflow-hidden">` → `<header className="relative aspect-[865/503] overflow-hidden">` |
| `src/pages/HojaVidaAnimal.tsx` | Si tiene banner con la misma imagen, aplicar el mismo `aspect-[865/503]`; si su imagen tiene otro ratio, dejar como está (lo verifico al implementar). |

### Notas
- Tailwind soporta `aspect-[865/503]` como arbitrary value out-of-the-box.
- El `BottomTabBar` y el FAB no se ven afectados; el aumento de altura solo empuja el contenido hacia abajo dentro del scroll natural de la página.
- La franja dorada con el título sigue justo debajo, sin tocar.
- Esto se combina perfecto con la barra negra superior del plan anterior: la barra negra cubre la safe area y el banner empieza justo debajo a su tamaño real.

### Pendiente / no incluido
- La barra negra superior (`SafeAreaTopBar`) y el fix del FAB cortado siguen pendientes del plan anterior aprobado — los implemento juntos en la misma tanda para que quede coherente.

