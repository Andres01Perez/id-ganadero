## Objetivo

Hacer que todos los botones de la sección **Otros** tengan el mismo ancho, sin importar el largo del texto.

## Cambio

En `src/pages/Otros.tsx`, agregar `w-64` (ancho fijo) a la clase del botón. El contenedor ya está centrado (`flex flex-col items-center`), así que los botones quedarán alineados y con ancho idéntico. El texto sigue centrado dentro del pill.

```tsx
className="w-64 bg-gold-solid text-ink rounded-full py-3 px-6 text-sm font-semibold uppercase tracking-wider shadow-gold active:scale-95 transition-transform text-center"
```

A futuro, cualquier opción nueva que agreguemos hereda el mismo ancho automáticamente.