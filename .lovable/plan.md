# Modal Ver / Descargar para archivos de genealogía

## Problema
El visor a pantalla completa actual (`FileViewerDialog`) no se ve bien al abrir desde la lista de Genealogía. Queremos un paso intermedio simple.

## Solución
Al tocar un archivo (miniatura o nombre) en `AnimalGenealogia`, abrir un pequeño modal centrado con dos acciones:

- **Ver** → abre el archivo en una nueva pestaña del navegador (`window.open(file_url, "_blank")`). Se elimina el uso del visor a pantalla completa.
- **Descargar** → descarga directamente el archivo al dispositivo (mismo flujo `fetch` + `Blob` + `<a download>` que ya tiene `FileViewerDialog.handleDownload`, con fallback a abrir en pestaña nueva si falla).

El modal se cierra al elegir cualquier acción o al tocar fuera / botón cerrar.

## Diseño
- Componente nuevo: `src/components/FileActionDialog.tsx` usando `Dialog` de shadcn (identidad visual existente: fondo `bg-card`, botón principal dorado `bg-gold-solid text-ink`, botón secundario `variant="outline"`).
- Título: nombre del archivo (truncado).
- Dos botones grandes apilados, fáciles de tocar en móvil:
  - `Ver archivo` (icono `Eye`)
  - `Descargar` (icono `Download`, muestra spinner mientras descarga)

## Archivos
- **Nuevo**: `src/components/FileActionDialog.tsx`
- **Editado**: `src/pages/AnimalGenealogia.tsx`
  - Reemplazar `viewing` por `selected: Doc | null` y montar `<FileActionDialog>` en lugar de `<FileViewerDialog>`.
  - Quitar import de `FileViewerDialog`.
- **Sin cambios**: `FileViewerDialog.tsx` se deja en el repo por si se reutiliza luego (no se borra salvo que pidas lo contrario).

¿Apruebo y procedo?
