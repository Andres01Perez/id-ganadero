

## Modal de recorte de imagen al subir assets

### Objetivo
Cuando el superadmin sube una imagen en `/superadmin/imagenes`, antes de guardarla se abre un modal donde recorta y ajusta la imagen al **aspect ratio exacto** que esa imagen va a ocupar en la app. Así no queda deformada, descuadrada ni con bandas negras.

### Librería
`react-easy-crop` — dependencia ligera (~30kb), pinch-zoom + arrastre nativo en touch y desktop, devuelve coordenadas de recorte que aplicamos sobre canvas. Sin estilos pesados.

### Aspect ratios por tipo de asset

| Asset | Ratio | Razón |
|---|---|---|
| Iconos del menú (Fincas, Machos, Hembras, Crías, Embriones, Otros) | **1:1** | Se muestran en círculo `w-24 h-24` |
| Logo JPS | **1:1** | Aparece pequeño y cuadrado en cabeceras |
| Banner del menú | **865:503** | Aspect ratio actual del header |
| Hero del login | **3:4** (vertical) | El login es mobile-first vertical |
| Foto de finca | **16:10** | La card de finca usa este ratio |

Estos ratios se definen en cada llamada a `AssetDropzone` / `FincaPhotoCard` mediante una nueva prop `cropAspect`.

### Cambios

**1. Nuevo componente `src/components/ImageCropDialog.tsx`**
- Modal shadcn `Dialog` con:
  - Área de recorte (`react-easy-crop`) con el `aspect` recibido por prop.
  - Slider de zoom (1× a 3×).
  - Botón "Cancelar" / "Recortar y subir".
- Props: `open`, `file: File`, `aspect: number`, `outputSize: { width, height }`, `onConfirm: (blob: Blob) => void`, `onCancel`.
- Al confirmar: lee crop pixels → dibuja la región sobre un canvas del tamaño de salida → exporta JPEG 0.85 quality → llama `onConfirm(blob)`.
- Internamente reemplaza la lógica de `resizeImage` para este caso (el canvas final ya tiene el tamaño exacto deseado, así que sale optimizado).

**2. `src/components/AssetDropzone.tsx`** — refactor del flujo de subida:
- Nueva prop `cropAspect: number` (obligatoria) y `outputSize?: { width: number; height: number }` (opcional, default calculado a partir de `maxSize` y `cropAspect`).
- Cuando el usuario suelta/elige archivo:
  1. Validar que es imagen.
  2. Guardar el `File` en estado `pendingFile`.
  3. Abrir `ImageCropDialog`.
  4. Al confirmar → recibe `blob` ya recortado y dimensionado → sube directo a Storage + upsert en `app_assets` (misma lógica de hoy, sin pasar por `resizeImage`).
  5. Al cancelar → limpiar `pendingFile`, no subir nada.

**3. `src/pages/SuperAdmin/Imagenes.tsx`** — pasar el `cropAspect` correcto a cada bloque:
- Iconos del menú → `cropAspect={1}`, `outputSize={{ width: 512, height: 512 }}`.
- Logo → `cropAspect={1}`, `outputSize={{ width: 512, height: 512 }}`.
- Banner del menú → `cropAspect={865/503}`, `outputSize={{ width: 1600, height: 930 }}`.
- Hero del login → `cropAspect={3/4}`, `outputSize={{ width: 1200, height: 1600 }}`.
- Refactor de `FincaPhotoCard` para usar el mismo `ImageCropDialog` → `cropAspect={16/10}`, `outputSize={{ width: 1280, height: 800 }}`.

**4. Estructura de los items en `Imagenes.tsx`**
Cambiar arrays `menuItems` y `brandItems` para que cada entrada lleve también su `cropAspect` y `outputSize`:
```ts
const menuItems = [
  { key: ASSET_KEYS.iconFincas, label: "Icono · Fincas", aspect: 1, output: {w:512,h:512} },
  // ...
];
```

**5. Dependencias**
- Añadir `react-easy-crop` al `package.json`.

### UX del modal
- Título: "Ajustar imagen · {label}"
- Subtítulo pequeño con el ratio: "Formato: cuadrado (1:1)" / "Formato: panorámico (16:10)" — texto humano, no fracciones.
- Área grande de recorte (≥ 400px de alto en desktop, full-width en móvil).
- Slider zoom abajo con etiquetas "−" / "+".
- Footer con botones Cancelar (ghost) / Recortar y subir (primary).
- Si el usuario cierra el modal sin confirmar → no se sube nada.

### Compatibilidad / cleanup
- `resizeImage` queda intacto en `src/lib/image.ts` por si alguna otra subida lo usa en el futuro (en `Imagenes.tsx` ya no se invoca directamente — el crop dialog produce el blob final).
- No hay migraciones de BD ni cambios en edge functions.
- No afecta a admins ni operarios — solo el panel `/superadmin/imagenes`.

### Archivos modificados / creados

| Archivo | Cambio |
|---|---|
| `src/components/ImageCropDialog.tsx` | **Nuevo** — modal de recorte reutilizable |
| `src/components/AssetDropzone.tsx` | Integrar el dialog, nuevas props `cropAspect` / `outputSize` |
| `src/pages/SuperAdmin/Imagenes.tsx` | Pasar aspect/output a cada asset; refactor `FincaPhotoCard` para usar el dialog |
| `package.json` | Añadir `react-easy-crop` |

### Cómo verificar
1. Entrar a `/superadmin/imagenes`.
2. Subir una imagen a un icono del menú → modal abre con recorte cuadrado → ajustar zoom y posición → confirmar → comprobar que en `/menu` el círculo se ve perfectamente centrado.
3. Subir una imagen al banner del menú → modal abre con recorte panorámico → confirmar → ver que el banner no aparece deformado.
4. Subir foto a una finca → modal con 16:10 → confirmar → la card de la finca muestra la foto sin distorsión.
5. Cancelar el modal → no debe subir nada ni cambiar la imagen actual.

