
# Botón de exportar en cada sección de seguimiento

Agregar un botón minimalista de "Exportar a Excel" únicamente en las páginas de seguimiento de cada animal (Control de celo, Aspiraciones, Embriones, Palpaciones, Cruces, Dieta, Peso, Partos, Chequeo veterinario). No se toca Hoja de Vida ni Genealogía ni listas generales.

## Comportamiento

- Icono `Download` discreto (`Button variant="ghost" size="icon"`) en el header de la sección, a la derecha del título.
- Al pulsar genera un `.xlsx` con UNA hoja que contiene exactamente los registros mostrados en pantalla (los `rows` ya cargados, con los mismos filtros y orden).
- El archivo incluye un pequeño encabezado arriba con:
  - Animal: `{numero} - {nombre}`
  - Tipo: `{título de la sección}` (ej: "Peso")
  - Fecha de exportación
- Debajo del encabezado: tabla con una columna por cada `field` definido en `seguimientoConfigs[tipo].fields` (usando `label` como cabecera).
- Nombre de archivo: `{tipo}_{numero-animal}_{YYYY-MM-DD}.xlsx` (ej: `peso_683-01_2026-05-30.xlsx`).
- Botón deshabilitado cuando `rows.length === 0` (con tooltip "Sin registros para exportar").
- Toast de confirmación al terminar.

## Cambios técnicos

### Nuevo helper: `src/lib/export-seguimiento-excel.ts`
Función única y enfocada:

```ts
exportSeguimientoToExcel({
  tipo: SeguimientoTipo,
  config: SeguimientoConfig,
  animal: { numero: string; nombre: string | null },
  rows: Record<string, unknown>[],
})
```

- Usa `xlsx` (ya instalado).
- Construye una hoja con: filas de meta (Animal / Sección / Fecha) → fila vacía → encabezados (`field.label`) → filas con `row[field.name]` formateado (fechas a `YYYY-MM-DD`, valores nulos como `""`, `select` mapeado a su label visible).
- Ajusta anchos de columna automáticamente.

### Modificación: `src/components/seguimiento/SeguimientoHeader.tsx`
- Aceptar nuevas props: `onExport: () => void` y `canExport: boolean`.
- Renderizar el botón `Download` a la derecha del título cuando `onExport` esté presente.

### Modificación: `src/pages/AnimalSeguimiento.tsx`
- Importar el helper y pasar `onExport` / `canExport={rows.length > 0}` al `SeguimientoHeader`.
- El handler llama a `exportSeguimientoToExcel` con `tipo`, `config`, `animal`, `rows`.

## Lo que NO cambia

- Exportador completo en `/gestion/exportar`: intacto.
- `HojaVidaAnimal`, `Genealogía`, listas de Animales/Empleados/Potreros: sin cambios.
- `export-config.ts` y `export-excel.ts`: sin cambios.
- No se agregan tablas ni migraciones.

