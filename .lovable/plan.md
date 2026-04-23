## Rediseñar seguimiento del animal como vistas históricas con CRUD

### Enfoque corregido

La primera parte se mantiene con la creacion de la tabla campeonatos.

Lo que cambia del plan anterior:

```text
No será solo un modal.
Cada opción tendrá una vista propia de historial.
```

Desde la hoja de vida del animal, cada botón llevará a una pantalla dedicada:

```text
/animal/:animalId/seguimiento/:tipo
```

Ejemplos:

```text
/animal/123/seguimiento/peso
/animal/123/seguimiento/palpaciones
/animal/123/seguimiento/campeonatos
```

---

## Experiencia de usuario

### En la hoja de vida del animal

Los botones actuales dejarán de mostrar “Próximamente”.

Al tocar una opción:

```text
Control de calor
Aspiraciones
Embriones
Palpaciones
Cruces
Dieta
Peso
Partos
Chequeo
Campeonatos
```

se abrirá una vista completa con:

```text
1. Encabezado del animal
2. Nombre de la sección
3. Resumen rápido
4. Historial de registros
5. Botón para crear nuevo registro
6. Acciones para ver, editar o eliminar cada registro
```

---

## Nueva vista de seguimiento

Crearé una nueva página:

```text
src/pages/AnimalSeguimiento.tsx
```

Esta página recibirá:

```text
animalId
tipo de seguimiento
```

Y según la opción mostrará el historial correcto.

Estructura visual:

```text
[Volver]  Nombre animal / número

Peso
Historial de pesajes

Último registro:
450 kg - 20/04/2026

[+ Nuevo registro]

Lista histórica:
- 20/04/2026 | 450 kg | +12 kg
  [Editar] [Eliminar]

- 15/03/2026 | 438 kg
  [Editar] [Eliminar]
```

La vista será mobile-first, simple y clara, no una tabla pesada.

---

## CRUD completo por cada opción

Cada vista permitirá:

```text
Crear
Ver historial
Editar
Eliminar
```

### Crear

El botón:

```text
+ Nuevo registro
```

mostrará un formulario dentro de la misma vista, no como modal principal.

Ejemplo de navegación interna:

```text
Historial
→ Nuevo registro
→ Guardar
→ Volver al historial actualizado
```

### Editar

Cada registro tendrá acción:

```text
Editar
```

Al editar, se cargan los datos existentes en el formulario de esa misma vista.

### Eliminar

Cada registro tendrá acción:

```text
Eliminar
```

Antes de borrar se mostrará confirmación simple:

```text
¿Eliminar este registro?
```

---

## Formularios por opción

### Control de calor

Tabla:

```text
ciclos_calor
```

Campos:

```text
Fecha *
Próximo calor estimado
Notas
```

Automático:

```text
animal_id
responsable_id
```

El próximo calor se podrá calcular con fecha + 21 días.

---

### Aspiraciones

Tabla:

```text
aspiraciones
```

Campos:

```text
Fecha *
Cantidad de ovocitos
Notas
```

Automático:

```text
animal_id
responsable_id
```

---

### Embriones

Tabla:

```text
embriones_detalle
```

Campos:

```text
Estado del embrión
Fecha de transferencia
Donadora
Receptora
Notas
```

Opciones:

```text
Congelado
Transferido
Implantado
Perdido
Nacido
```

Importante: esta vista tendrá un texto corto para evitar confusión:

```text
Esta sección es para seguimiento del embrión. Para registrar una aspiración de donadora usa “Aspiraciones”.
```

---

### Palpaciones

Tabla:

```text
palpaciones
```

Campos:

```text
Fecha *
Resultado *
Tiempo de preñez en días
Notas
```

Opciones:

```text
Positivo
Negativo
```

---

### Cruces

Tabla:

```text
inseminaciones
```

Campos:

```text
Fecha *
Hora
Método *
Toro de la finca
O nombre de toro externo
Notas
```

Opciones:

```text
Monta directa
Inseminación artificial
FIV
Transferencia de embrión
```

---

### Dieta

Tabla:

```text
dietas
```

Campos:

```text
Fecha de inicio *
Fecha de fin
Tipo de alimento *
Cantidad kg/día
Notas
```

---

### Peso

Tabla:

```text
pesajes
```

Campos:

```text
Fecha *
Peso kg *
Foto / evidencia
```

Automático:

```text
ganancia_desde_anterior_kg
```

La ganancia se calculará comparando contra el pesaje anterior del mismo animal.

La vista de peso también mostrará un resumen:

```text
Último peso
Peso anterior
Ganancia
```

---

### Partos

Tabla:

```text
partos
```

Campos:

```text
Fecha *
Número de parto
Resultado *
Sexo de la cría
Cría registrada
Notas
```

Opciones de resultado:

```text
Vivo
Muerto
Aborto
```

---

### Chequeo

Tabla:

```text
chequeos_veterinarios
```

Campos:

```text
Fecha *
Veterinario
Estado
Diagnóstico
Notas
```

---

### Campeonatos

Crearé una tabla nueva:

```text
campeonatos
```

Campos:

```text
id
animal_id
fecha
nombre
lugar
categoria
resultado
juez
evidencia_url
notas
responsable_id
created_at
updated_at
```

Formulario:

```text
Fecha *
Nombre del campeonato *
Lugar
Categoría
Resultado / puesto obtenido
Juez
Foto o evidencia
Notas
```

---

## Historial por cada vista

Cada pantalla mostrará los registros ordenados del más reciente al más antiguo.

Ejemplos:

### Peso

```text
20/04/2026
450 kg
Ganancia: +12 kg
Evidencia disponible
```

### Palpaciones

```text
20/04/2026
Resultado: Positivo
Tiempo de preñez: 90 días
Notas...
```

### Campeonatos

```text
Feria Nacional Brahman
20/04/2026
Categoría: Hembra adulta
Resultado: Primer puesto
Juez: ...
Foto / evidencia
```

---

## Componentes nuevos

Crearé una estructura reutilizable, pero con formularios específicos:

```text
src/pages/AnimalSeguimiento.tsx
src/components/seguimiento/SeguimientoHeader.tsx
src/components/seguimiento/SeguimientoList.tsx
src/components/seguimiento/SeguimientoForm.tsx
src/lib/seguimiento-config.ts
```

La configuración definirá:

```text
nombre visible
tabla de Supabase
campo animal_id correcto
campos del formulario
cómo mostrar cada registro
validaciones
orden del historial
```

Esto evita repetir demasiado código, pero permite que cada opción tenga sus propios campos.

---

## Cambios en rutas

Actualizaré:

```text
src/App.tsx
```

Agregando una ruta protegida:

```text
/animal/:id/seguimiento/:tipo
```

La ruta estará dentro de `ProtectedRoute`, igual que la hoja de vida.

---

## Cambios en hoja de vida

Actualizaré:

```text
src/pages/HojaVidaAnimal.tsx
```

Para que los botones naveguen a la nueva vista:

```text
Control de calor → /animal/:id/seguimiento/calor
Peso → /animal/:id/seguimiento/peso
Campeonatos → /animal/:id/seguimiento/campeonatos
```

Ya no mostrarán `toast.info("Próximamente")`.

---

## Base de datos

Crearé una migración solo para lo que falta:

```text
tabla campeonatos
índices
RLS
trigger updated_at
trigger audit
```

RLS seguirá la misma regla de las demás tablas:

```text
user_can_access_animal(auth.uid(), animal_id)
```

Políticas:

```text
Ver campeonatos
Crear campeonatos
Editar campeonatos
Eliminar campeonatos
```

La creación exigirá:

```text
responsable_id = auth.uid()
usuario activo
acceso al animal
```

---

## Evidencias / fotos

Para registros con evidencia:

```text
Peso
Campeonatos
```

Usaré el bucket existente:

```text
animal-fotos
```

Rutas:

```text
{animalId}/eventos/pesajes/{timestamp}.jpg
{animalId}/eventos/campeonatos/{timestamp}.jpg
```

Si las políticas actuales del bucket bloquean la subida para usuarios que sí tienen acceso al animal, las ajustaré para permitir evidencia a usuarios autenticados activos sin exponer claves privadas.

---

## Resultado esperado

Después del cambio:

```text
1. La hoja de vida seguirá siendo la entrada principal del animal.
2. Cada botón abrirá una vista histórica completa.
3. Cada vista permitirá crear, editar y eliminar registros.
4. Campeonatos tendrá tabla propia y CRUD completo.
5. Los datos históricos serán fáciles de consultar en celular.
6. Aspiraciones y Embriones quedarán diferenciados.
7. La app dejará de depender de modales pequeños para un seguimiento que requiere historial.
```