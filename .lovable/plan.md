## Objetivo
Cuando el usuario toca un archivo en Genealogía, abrir un visor dentro de la app (no salir a Supabase). Soporta imágenes y PDFs, con zoom/pellizco nativo, y botón de descarga.

## Cambios

### 1. Nuevo componente `src/components/FileViewerDialog.tsx`
Dialog full-screen (usando `Dialog` de shadcn que ya está) con:
- Header negro: botón cerrar (X) a la izquierda, nombre del archivo centrado truncado, botón descargar (icono `Download`) a la derecha.
- Cuerpo:
  - **Imágenes** (`mime_type` empieza con `image/`): `<img>` con `object-contain` y contenedor con `touch-action: pinch-zoom` + `overflow-auto`, fondo negro. Esto da el pinch-to-zoom nativo en iOS/Android sin librerías.
  - **PDFs** (`application/pdf`): `<iframe src={file_url}>` ocupando todo. Los WebView de iOS/Android renderizan PDFs nativamente. Como fallback (algunos Android viejos no), si el iframe falla mostramos un botón "Abrir PDF" que dispara la descarga.
  - **Otros**: icono + nombre + botón "Descargar".
- Botón descarga: `fetch(url) → blob → URL.createObjectURL → <a download>` para forzar descarga real con el nombre original (en lugar de abrir en otra pestaña). Fallback: link directo con `download` attribute.

### 2. `src/pages/AnimalGenealogia.tsx`
- Reemplazar los dos `<a href={d.file_url} target="_blank">` por `<button onClick={() => setViewing(d)}>`.
- Estado `viewing: Doc | null` y render del `<FileViewerDialog>` al final.
- Mantener todo el resto (subida, borrado, lista) igual.

## Notas técnicas
- Trabajo solo en frontend/presentación, sin tocar tablas, RLS, ni el bucket (sigue público).
- No agregamos dependencias (nada de pdf.js, react-pdf, etc.). Usamos el visor PDF nativo del navegador vía iframe — funciona en Safari iOS, Chrome Android y todos los desktop.
- El pinch-to-zoom para imágenes se hace con `touch-action: pinch-zoom` + scroll, que es el comportamiento estándar de cualquier app móvil.
- El botón descargar usa blob para garantizar el nombre del archivo y que en iOS no abra el archivo en una nueva pestaña.
