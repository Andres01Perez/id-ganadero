
## Separar foto circular y foto banner de cada animal

### Objetivo

Cambiar el manejo de fotos de animales para que haya dos imágenes distintas:

1. **Foto circular**
   - Se usa en listados de animales.
   - Se recorta cuadrada `1:1`.
   - Sigue usando el campo actual `foto_principal_url`.

2. **Foto banner principal**
   - Se usa en la hoja de vida del animal, arriba, como imagen rectangular.
   - Se recorta en formato banner, igual al estilo de los banners actuales.
   - Se guardará en un nuevo campo: `foto_banner_url`.

---

## Cambios de base de datos

Crear una migración para agregar el nuevo campo a `animales`:

```sql
alter table public.animales
add column if not exists foto_banner_url text;
```

No se necesitan nuevas políticas RLS porque la lectura y actualización del animal ya están controladas por las políticas existentes de la tabla `animales`.

---

## Cambios en el formulario de animal

Actualizar `src/components/AnimalForm.tsx` para pedir dos fotos separadas:

```text
Foto del listado
- Circular
- Recorte 1:1
- Se ve en listas y tablas

Banner principal
- Rectangular
- Recorte tipo banner
- Se ve en la hoja de vida del animal
```

### Recorte

Reutilizar el componente existente:

```text
src/components/ImageCropDialog.tsx
```

Configurar dos modos de recorte:

```text
Foto circular:
aspect: 1
output: 512 x 512

Banner principal:
aspect: 865 / 503
output: 1600 x 930
```

El usuario podrá escoger y ajustar cada imagen antes de guardar.

---

## Guardado de imágenes

Mantener el bucket actual:

```text
animal-fotos
```

Guardar las imágenes en rutas separadas para orden:

```text
{animalId}/avatar/{timestamp}.jpg
{animalId}/banner/{timestamp}.jpg
```

Al guardar el animal:

- si cambió la foto circular, actualizar `foto_principal_url`
- si cambió el banner, actualizar `foto_banner_url`

---

## Cambios en la hoja de vida

Actualizar `src/pages/HojaVidaAnimal.tsx`:

- consultar también `foto_banner_url`
- usar `foto_banner_url` en la foto grande superior
- si un animal viejo no tiene banner, usar como respaldo `foto_principal_url`
- si no tiene ninguna foto, mostrar el logo como fallback

Cambiar el header para que sea realmente rectangular tipo banner:

```text
aspect-[865/503]
```

en lugar de una altura fija que puede deformar la imagen en móvil.

---

## Cambios en listados

Mantener los listados usando la foto circular actual:

- `src/pages/CategoriaAnimales.tsx`
- `src/components/AnimalAvatar.tsx`
- tablas administrativas que muestran avatar circular

No se cambiará el comportamiento del listado: seguirá mostrando `foto_principal_url`.

---

## Ajuste visual del formulario

En el formulario se mostrará una sección clara de imágenes:

```text
Imágenes del animal

[Foto del listado]
Vista circular pequeña
Botón: Añadir / Cambiar

[Banner principal]
Vista rectangular
Botón: Añadir / Cambiar
```

Con textos simples para evitar confusión:

```text
Foto del listado
Se verá en el círculo de las listas.

Banner principal
Se verá arriba en la hoja de vida.
```

---

## Resultado esperado

Después del cambio:

```text
1. Al crear o editar un animal, el usuario puede subir dos fotos.
2. La foto circular se recorta cuadrada.
3. El banner se recorta rectangular.
4. La lista de animales mantiene la foto redonda.
5. La hoja de vida muestra una imagen rectangular tipo banner.
6. Los animales existentes siguen funcionando aunque todavía no tengan banner.
```

