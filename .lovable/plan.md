## Ajustes al módulo Inventario

### 1. Cantidad inicial opcional al crear producto

En `src/components/InventarioProductoForm.tsx` se agrega un nuevo campo opcional **"Cantidad inicial"** (numérico, ≥ 0, vacío = no crear movimiento). Aplica a las 3 categorías (alimentación, medicina, otros).

Comportamiento:

- Solo se muestra al **crear** un producto, no al editar (en edición se siguen usando movimientos).
- Si el usuario ingresa una cantidad > 0, después del `insert` del producto se inserta automáticamente un movimiento en `inventario_movimientos` con:
  - `tipo: 'entrada'`
  - `cantidad`: lo ingresado
  - `fecha`: hoy
  - `notas`: "Cantidad inicial"
  - `responsable_id`: `user.id`
- Si falla la creación del movimiento, se muestra toast de advertencia pero el producto queda creado (el usuario puede registrarlo después manualmente).
- Posición sugerida en el form: justo encima de "Punto mínimo / Importancia".

No se requieren cambios de base de datos ni de RLS (el flujo ya está soportado).

### 2. Vista `/categoria-inventario` con 3 botones cuadrados

Rediseño visual de `src/pages/CategoriaInventario.tsx`:

- Reemplazar los actuales botones circulares por **3 tarjetas cuadradas** (Alimentación, Medicina, Otros).
- Layout: una sola columna centrada, tarjetas con ancho controlado (`max-w-xs mx-auto`), espaciadas verticalmente (`space-y-4`), con margen superior y laterales generosos para que queden centradas tanto vertical como horizontalmente respecto al área visible.
- Cada botón: cuadrado (`aspect-square` o `h-32 w-full max-w-[16rem]`), `rounded-2xl`, fondo `bg-card`, borde `border-2 border-gold`, `shadow-soft`, ícono grande arriba (Wheat / Stethoscope / Wrench en `text-gold-deep`) y label debajo en mayúsculas con `tracking-jps`.
- Mantener el badge rojo de productos críticos en la esquina superior derecha.
- Conservar header dorado, `FincaActivaChip` y `BottomTabBar`.

### Archivos a modificar

- `src/components/InventarioProductoForm.tsx` — nuevo campo + lógica de movimiento inicial.
- `src/pages/CategoriaInventario.tsx` — rediseño visual a botones cuadrados centrados.

Sin cambios en base de datos, rutas, ni en otras pantallas del módulo.