
## Corregir MarIA: no pedir permiso para consultar, no inventar datos y responder más rápido

### Problemas detectados

1. **MarIA preguntó si podía revisar la base de datos**
   - Esto no debe pasar. MarIA debe consultar directamente las herramientas disponibles cuando el usuario pregunte por animales, fincas, pesos, edades, palpaciones o reproducción.

2. **MarIA dijo que hay 200 hembras en Villa Paula**
   - Ese dato es falso.
   - Verificación directa en la base de datos: en `Villa Paula` actualmente hay **3 hembras activas**.

3. **MarIA tarda demasiado en responder después de que el usuario deja de hablar**
   - El retraso de aproximadamente 15 segundos corresponde a configuración de detección de fin de turno / silencio del agente.
   - Debe reducirse para que MarIA detecte antes que el usuario terminó de hablar.

---

## Cambios que implementaré

### 1. Forzar instrucciones estrictas para MarIA

Actualizaré la configuración de sesión/prompt de MarIA para que tenga reglas claras:

```text
Nunca pidas permiso para consultar la base de datos.
Si el usuario pregunta por datos de animales, fincas, pesos, edades, preñez, palpaciones o conteos, usa las herramientas disponibles inmediatamente.
No inventes números.
Para conteos o cantidades, siempre usa una herramienta de consulta.
Si no hay datos, responde que no encontraste datos.
```

Esto se aplicará desde la app al iniciar la conversación usando `overrides.agent.prompt`, y si es necesario también se actualizará el prompt del agente en ElevenLabs.

---

### 2. Crear herramienta específica para conteos exactos

El problema de “200 hembras” puede ocurrir porque MarIA está razonando sin una herramienta dedicada de conteo.

Agregaré una nueva herramienta client-side:

```text
contar_animales
```

Permitirá contar con filtros:

```text
tipo: hembra / macho / cria / embrion / otro
finca: Villa Paula
sexo: M / H
activo: true
```

Ejemplo de respuesta real:

```json
{
  "total": 3,
  "filtros": {
    "tipo": "hembra",
    "finca": "Villa Paula"
  }
}
```

Así, para preguntas como:

```text
¿Cuántas hembras tenemos en la finca Villa Paula?
```

MarIA deberá usar `contar_animales` y responder con el número exacto.

---

### 3. Mejorar `resumen_ganaderia`

Actualizaré `resumen_ganaderia` para que sea más útil y menos ambiguo:

- aceptar filtro opcional por finca
- devolver totales por tipo
- devolver totales por sexo
- devolver totales exactos por finca visible
- evitar límites que puedan distorsionar conteos

Esto ayudará cuando el usuario haga preguntas generales como:

```text
¿Cuántos animales hay en Villa Paula?
¿Cuántas hembras tengo?
¿Cuántos machos hay?
```

---

### 4. Corregir búsqueda por finca

Revisaré la consulta actual de `buscar_animales`, porque el filtro:

```ts
.ilike("fincas.nombre", ...)
```

puede no filtrar correctamente cuando se usa relación anidada en Supabase.

La cambiaré por una estrategia más confiable:

1. Buscar primero las fincas cuyo nombre coincida.
2. Tomar sus `id`.
3. Filtrar animales con `.in("finca_id", fincaIds)`.

Esto hará que MarIA no mezcle animales de otras fincas.

---

### 5. Registrar/usar la nueva herramienta en ElevenLabs

La app tendrá la herramienta `contar_animales`, pero ElevenLabs también debe conocerla como Client Tool.

Agregaré el soporte en React y dejaré la configuración lista para que el agente pueda llamarla.

Herramientas finales:

```text
buscar_animales
detalle_animal
contar_animales
consultar_pesajes
consultar_reproduccion
resumen_ganaderia
```

---

### 6. Reducir el tiempo de espera al hablar

Haré dos ajustes:

#### En la app
Al iniciar sesión con ElevenLabs, enviaré configuración de baja latencia cuando el SDK lo permita:

```ts
connectionDelay: {
  default: 0,
  android: 0,
  ios: 0
}
```

y mantendré la conexión por WebSocket/WebRTC sin retardos artificiales.

#### En ElevenLabs
Revisaré la configuración del agente relacionada con:

```text
turn detection
silence timeout
end of speech detection
responsiveness
latency optimization
```

Objetivo:

```text
silencio para terminar turno: ~2 segundos
```

Si ElevenLabs permite actualizarlo por API, lo dejaré aplicado desde la Edge Function o una actualización del agente. Si esa parte solo está disponible desde el dashboard, dejaré indicada la configuración exacta que debe quedar en el agente.

---

### 7. Evitar respuestas numéricas sin herramienta

Agregaré instrucciones para que MarIA no responda conteos desde memoria o suposición.

Regla:

```text
Para cualquier pregunta que incluya “cuántos”, “cuántas”, “total”, “cantidad”, “número de animales”, “hembras”, “machos” o una finca específica, primero debe llamar una herramienta.
```

Esto previene respuestas inventadas como “200 hembras”.

---

## Archivos a modificar

### `src/lib/maria-tools.ts`

- agregar `contar_animales`
- mejorar filtro por finca
- mejorar `resumen_ganaderia`
- devolver respuestas más explícitas para que el agente no tenga que inferir

### `src/components/MariaVoiceDialog.tsx`

- agregar `overrides.agent.prompt` con reglas estrictas
- agregar configuración de baja latencia si el SDK la acepta
- mantener UI simple: escuchando / hablando / conectando
- no mostrar detalles técnicos al usuario

### `supabase/functions/elevenlabs-conversation-token/index.ts`

- revisar si se puede consultar/actualizar configuración del agente en ElevenLabs
- mantener token y signed URL
- si ElevenLabs permite configurar turn-taking por API, aplicar el objetivo de 2 segundos

---

## Pruebas

Probaré estos casos:

```text
¿Cuántas hembras tenemos en la finca Villa Paula?
```

Resultado esperado:

```text
En Villa Paula hay 3 hembras activas.
```

```text
¿Cuántos animales hay en Villa Paula?
```

Resultado esperado: conteo real desde Supabase.

```text
Busca la vaca 683/01
```

Resultado esperado: búsqueda real sin pedir permiso.

```text
¿Cuáles fueron sus últimos pesos?
```

Resultado esperado: consulta directa a `consultar_pesajes`.

También validaré que:

```text
MarIA no pregunte “¿me dejas revisar la base de datos?”
MarIA no invente conteos.
MarIA responda aproximadamente 2 segundos después de que el usuario termina de hablar.
```

---

## Resultado esperado

Después del cambio:

```text
Usuario: ¿Cuántas hembras tenemos en la finca Villa Paula?
MarIA: En Villa Paula hay 3 hembras activas.
```

Sin pedir permiso, sin inventar números y con menor tiempo de espera.
