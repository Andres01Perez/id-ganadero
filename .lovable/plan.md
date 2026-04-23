

## Corregir botón "Volver" en hoja de vida del animal

### Problema

Cuando el usuario navega así:

```text
Menú principal → Categoría → Hoja de vida del animal → Seguimiento (ej. Peso)
```

Y luego pulsa "Volver" en Seguimiento, regresa a la Hoja de vida del animal (correcto). Pero al pulsar "Volver" nuevamente en la Hoja de vida, vuelve a Seguimiento porque `navigate(-1)` retrocede en el historial del navegador, generando un bucle.

### Causa

En `src/pages/HojaVidaAnimal.tsx` el botón usa:

```text
onClick={() => navigate(-1)}
```

Esto depende del historial, no de la jerarquía de la app.

### Solución

Cambiar el botón "Volver" de la Hoja de vida del animal para que navegue directamente al menú principal en lugar de retroceder en el historial:

```text
onClick={() => navigate("/menu")}
```

Esto rompe el bucle y deja un comportamiento predecible: desde cualquier animal, "Volver" siempre lleva al menú de inicio.

### Sin cambios en

- El botón "Volver" de las pantallas de seguimiento (`SeguimientoHeader.tsx`) sigue usando retroceso normal, porque desde Seguimiento sí queremos volver a la Hoja de vida del animal.
- Categorías y demás pantallas no se tocan.

### Archivos que se tocarán

```text
src/pages/HojaVidaAnimal.tsx
```

