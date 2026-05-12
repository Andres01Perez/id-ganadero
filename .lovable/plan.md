## Objetivo
Cambiar los iconos circulares de `/menu-finca` por las imágenes webp subidas (Empleados, Potreros, Animales, Inventario, Compras y Ventas, Otros).

## Pasos

1. **Copiar las imágenes a `src/assets/menu-finca/`**
   - `user-uploads://EMPLEADOS.webp` → `src/assets/menu-finca/empleados.webp`
   - `user-uploads://POTREROS.webp` → `src/assets/menu-finca/potreros.webp`
   - `user-uploads://ANIMALES.webp` → `src/assets/menu-finca/animales.webp`
   - `user-uploads://INVENTARIOS.webp` → `src/assets/menu-finca/inventario.webp`
   - `user-uploads://COMPRAS_Y_VENTAS.webp` → `src/assets/menu-finca/compra-venta.webp`
   - `user-uploads://OTROS.webp` → `src/assets/menu-finca/otros.webp`

2. **Editar `src/pages/MenuFinca.tsx`**
   - Eliminar imports de iconos lucide (`Users`, `Grid3x3`, `Package`, `ArrowLeftRight`, `Settings`) y el componente `CowIcon`.
   - Importar las 6 imágenes como ES6 modules.
   - Cambiar el tipo `ModuloItem` de `icon: ComponentType` a `image: string`.
   - Actualizar el array `items` con la imagen correcta por opción.
   - En `CircleButton`, reemplazar el `<Icon />` por `<img src={item.image} alt={item.label} className="w-full h-full object-cover rounded-full" />`, manteniendo el círculo dorado de borde (`border-[3px] border-gold`) y removiendo el padding interno para que la foto llene el círculo.

## Notas
- Solo cambio visual; no se toca lógica, rutas ni layout.
- Las imágenes son webp ligeras y se cargan vía bundler (optimización Vite).
- El label debajo del círculo y el resto del menú permanecen igual.
