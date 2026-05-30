# Más espacio inferior bajo el menú flotante

## Problema
El menú inferior (BottomTabBar) es fijo y tapa contenido en pantallas pequeñas/grandes, sin permitir scroll suficiente.

## Solución
Aumentar el padding inferior de las utilidades globales que ya usan todas las páginas, en `src/index.css`:

- `.pb-safe-plus`: de `5rem` → `7rem` (≈ +32px extra de scroll bajo el menú)
- `.pb-safe-plus-lg`: de `6rem` → `8rem` (consistencia)

Como prácticamente todas las páginas (`Menu`, `MenuGestion`, `CategoriaAnimales`, `HojaVidaAnimal`, `Fincas`, `MenuFinca`, inventario, etc.) ya usan `pb-safe-plus`, el ajuste se propaga automáticamente sin tocar archivo por archivo.

## Detalle técnico
Único archivo editado: `src/index.css` (dos valores). Sin cambios en componentes ni en `BottomTabBar`.
