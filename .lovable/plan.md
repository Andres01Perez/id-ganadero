## Cambios

### 1. Migración SQL
- Añadir columnas `categoria text` y `subtipo text` a `animales_finca` (nullable).
- Migrar datos existentes: `subtipo = tipo`, `categoria = NULL` (quedarán como "sin clasificar").
- Quitar índice único anterior por `(finca_id, tipo)` si existe y crear uno nuevo `(finca_id, categoria, subtipo)` para evitar duplicados.
- Mantener la columna `tipo` por compatibilidad (sin uso en código nuevo); se puede limpiar más adelante.

### 2. `src/components/AnimalFincaForm.tsx`
Reemplazar inputs libres por dos `Select`:

```ts
const OPCIONES = {
  bovinos: [
    { value: "machos", label: "Machos" },
    { value: "hembras", label: "Hembras" },
  ],
  equinos: [
    { value: "caballos", label: "Caballos" },
    { value: "yeguas", label: "Yeguas" },
  ],
};
```

- Select 1 "Categoría": Bovinos / Equinos.
- Select 2 "Subtipo": opciones dependientes (deshabilitado hasta elegir categoría; se resetea al cambiar categoría).
- Input "Cantidad" (igual que ahora).
- Validación: ambos campos obligatorios + cantidad ≥ 0 entera.
- En insert/update guardar `categoria`, `subtipo` y también `tipo = subtipo` (para no romper backward compat con la columna NOT NULL).
- En carga de edición, leer `categoria` y `subtipo`; si `categoria` es null (registro legacy), preseleccionar lo que se pueda inferir o dejar vacío para que el admin elija.

### 3. `src/pages/finca/Animales.tsx` — visual
Lista nueva, agrupada por categoría:

```
┌──────────────────────────────────┐
│ 🐄 BOVINOS                       │
│   Machos                    24   │
│   Hembras                   58   │
├──────────────────────────────────┤
│ 🐎 EQUINOS                       │
│   Caballos                   3   │
│   Yeguas                     5   │
└──────────────────────────────────┘
```

- Header de grupo con banda dorada (`bg-gold-solid text-ink uppercase tracking-jps`).
- Cada subtipo en card blanco con subtipo a la izquierda y cantidad grande dorada a la derecha.
- Si quedan registros legacy sin categoría, agruparlos bajo "Sin clasificar".
- Toda fila sigue siendo botón → abre form en modo edición.
- Cambiar query a `select id, categoria, subtipo, tipo, cantidad`.

Sin cambios en RLS (ya cubiertas).
