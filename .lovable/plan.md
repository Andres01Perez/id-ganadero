
## Corregir error al guardar imágenes del animal

### Problema detectado

El error no viene del formulario de datos generales directamente. Viene de Supabase Storage al intentar subir el banner:

```text
POST /storage/v1/object/animal-fotos/{animalId}/banner/{timestamp}.jpg
new row violates row-level security policy
```

Esto confirma que el bloqueo está en las políticas RLS de `storage.objects` para el bucket:

```text
animal-fotos
```

El cambio reciente de seguridad quitó/ajustó políticas de lectura y dejó la subida con reglas que no están funcionando bien para el flujo actual de edición de imágenes.

---

## Qué voy a corregir

### 1. Crear una migración para Storage

Ajustaré las políticas del bucket `animal-fotos` para permitir que un usuario autenticado y activo pueda subir, actualizar y borrar imágenes únicamente cuando tenga acceso al animal.

La ruta de las imágenes ya empieza con el ID del animal:

```text
{animalId}/avatar/{timestamp}.jpg
{animalId}/banner/{timestamp}.jpg
{animalId}/eventos/pesajes/{timestamp}.jpg
{animalId}/eventos/campeonatos/{timestamp}.jpg
```

Usaré ese primer segmento para validar acceso con la función existente:

```text
user_can_access_animal(auth.uid(), animal_id)
```

---

### 2. Reemplazar políticas inseguras o inconsistentes

Eliminaré las políticas antiguas de `animal-fotos` que están mezcladas entre:

```text
solo admin
cualquier usuario autenticado
sin política SELECT para el flujo de upsert
```

Y crearé políticas consistentes:

```text
Ver objeto de animal-fotos:
- usuario autenticado
- usuario activo
- usuario con acceso al animal

Subir objeto:
- usuario autenticado
- usuario activo
- usuario con acceso al animal de la carpeta

Actualizar objeto:
- usuario autenticado
- usuario activo
- usuario con acceso al animal

Eliminar objeto:
- usuario autenticado
- usuario activo
- usuario con acceso al animal
```

Esto evita abrir todo el bucket a cualquier usuario y corrige el bloqueo al subir banner/foto.

---

### 3. Mantener compatibilidad con las imágenes actuales

Las imágenes existentes usan rutas como:

```text
{animalId}/{timestamp}.jpg
{animalId}/banner/{timestamp}.jpg
```

La nueva política tomará siempre el primer segmento como `animalId`, así que seguirá funcionando con las imágenes ya guardadas.

---

### 4. Ajustar el formulario de animal si es necesario

Revisaré `src/components/AnimalForm.tsx` para asegurar que el guardado siga este orden:

```text
1. Guardar datos generales del animal
2. Subir imagen/avatar o banner
3. Actualizar foto_principal_url / foto_banner_url en animales
4. Mostrar mensaje claro si falla solo la imagen
```

También mejoraré el mensaje de error para que no muestre el texto técnico:

```text
new row violates row-level security policy
```

En su lugar mostrará algo claro:

```text
No se pudo subir la imagen. Verifica que tengas acceso a este animal.
```

---

## Resultado esperado

Después del cambio:

```text
1. El usuario podrá guardar cambios al editar la información general del animal.
2. El banner se podrá subir correctamente.
3. La foto principal se podrá subir correctamente.
4. Las evidencias de peso y campeonatos seguirán funcionando.
5. El bucket animal-fotos seguirá protegido por finca/animal.
6. No se abrirá el bucket completo a usuarios sin acceso.
```

## Archivos / áreas que se tocarán

```text
supabase/migrations/
src/components/AnimalForm.tsx
```

No modificaré `src/integrations/supabase/types.ts` manualmente.
