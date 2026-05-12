## Objetivo
En `/superadmin/imagenes` mostrar, junto a cada imagen editable, un **mockup de la pantalla real** donde aparece esa imagen, para que el superadmin vea exactamente dónde quedará posicionada.

## Enfoque

Cada `AssetDropzone` añade un botón discreto **"Ver ubicación"** (o ícono `Eye`) que abre un `Dialog` con un mockup en marco de teléfono (mobile-first, igual que la app real) que pinta la pantalla correspondiente al asset, usando la imagen actual.

No se reusan las páginas reales — se hacen **mocks ligeros y estáticos** con HTML+Tailwind: rectángulos de placeholder para los demás elementos (botones, textos, otras imágenes) y la imagen del asset destacada con un anillo dorado pulsante para llamar la atención.

## Mockups a crear

Un componente `AssetLocationPreview` con un switch por `assetKey` que renderiza la plantilla correspondiente:

1. **Logo (`global.logo`)** — barra superior + login: marco de teléfono con la barra negra superior y el logo centrado, más una mini vista del login con el logo arriba.
2. **Login hero (`global.login_hero`)** — pantalla de login con la imagen ocupando la parte superior (3/4) y el formulario simulado abajo.
3. **Banner del menú (`menu.banner`)** — pantalla `/menu`: banner arriba (aspect 865/503), saludo, y grid 2x3 de tarjetas placeholder.
4. **Iconos del menú (`menu.icon.*`)** — grid del menú con las 6 tarjetas; la del icono editado se resalta con anillo dorado.
5. **Banners de categoría (`categoria.banner.machos|hembras|crias|embriones|fincas`)** — pantalla de lista: banner arriba, lista de items placeholder; etiqueta con el nombre de la categoría.
6. **Banner de menú-finca (`categoria.banner.menu_finca`)** — pantalla `/finca/:id/menu-finca`: banner arriba con label "fallback cuando la finca no tiene foto" + grid 2x3 de módulos.
7. **Foto de finca (pestaña Fincas)** — tarjeta de finca dentro de una mini lista en `/fincas`, con la foto ocupando la cabecera de la card.

## Cambios concretos

### Nuevo archivo `src/components/AssetLocationPreview.tsx`
- Recibe `assetKey`, `imageUrl`, `label`.
- Renderiza un marco de teléfono (`w-[280px] aspect-[9/19] rounded-[2rem] border-8 border-foreground/80 bg-background overflow-hidden`).
- Dentro, switch por `assetKey` que retorna una de las plantillas mock.
- El elemento que representa la imagen real usa `<img src={imageUrl}>` con anillo dorado animado (`ring-2 ring-primary animate-pulse`).
- Resto de elementos: barras `bg-muted`, círculos, textos placeholder con `bg-muted-foreground/20`.

### Nuevo archivo `src/components/AssetLocationDialog.tsx`
- `Dialog` de shadcn que envuelve `AssetLocationPreview`.
- Header: "Ubicación en la app" + nombre del asset.
- Footer pequeño explicando la ruta donde aparece (ej: "Visible en /menu, parte superior").

### Editar `src/components/AssetDropzone.tsx`
- Añadir prop opcional `previewKey?: string` (por defecto = `assetKey`).
- En la cabecera del card añadir botón ícono `Eye` que abre el dialog.
- Estado local `previewOpen`.

### Editar `src/pages/SuperAdmin/Imagenes.tsx`
- Sin cambios estructurales, sólo asegurar que cada `AssetDropzone` recibe el `assetKey` (ya lo hace).
- Para la pestaña "Fotos de fincas", añadir el mismo botón en `FincaPhotoCard` con un `previewKey` especial tipo `"finca.foto"`.

## Detalles de diseño
- Marco mobile coherente con la app real (negro + dorado).
- Mocks minimalistas, no realistas en contenido (sin imágenes externas) — todo con bloques de `bg-muted` y bordes redondeados.
- La imagen editada **se ve real** dentro del mock.
- Anillo dorado `ring-primary` + pequeña etiqueta "esta imagen" flotante con flecha.
- Animación sutil de entrada del anillo.

## Verificación
- Ir a `/superadmin/imagenes`, hacer clic en `Eye` de "Banner del menú" → abre dialog con un teléfono mostrando `/menu` y el banner real arriba.
- Probar con cada categoría de asset (logo, hero, iconos, banners, menú-finca, foto de finca) → cada uno muestra una pantalla diferente y reconocible.
- Cambiar la imagen y reabrir el preview → el mock se actualiza con la nueva imagen.
- En móvil (390px) el dialog encaja sin scroll horizontal.

## Notas técnicas
Sin cambios de base de datos, ni edge functions, ni nuevos assets. Todo es UI estática reutilizando shadcn `Dialog`, `lucide-react` (`Eye`), y los tokens del design system.