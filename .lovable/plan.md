
## Corregir por qué MarIA no escucha y simplificar la vista

### Diagnóstico confirmado

El problema principal no parece ser el permiso del micrófono, porque:

- ya se obtiene token correctamente desde `elevenlabs-conversation-token`
- el navegador sí intenta iniciar la sesión
- en los logs aparece este fallo real:

```text
Initial connection failed: v1 RTC path not found. Consider upgrading your LiveKit server version – Retrying
GET https://livekit.rtc.elevenlabs.io/rtc/v1/validate ... 404
```

Eso indica que la conexión actual por `WebRTC` está fallando en este entorno y MarIA no queda con una sesión de voz estable para escuchar bien al usuario.

Además, la UI actual está mostrando cosas que no deben verse:

- eventos crudos de ElevenLabs (`JSON.stringify(message)`)
- texto técnico sobre permisos/RLS
- estados poco claros para el usuario final

---

## Qué voy a cambiar

### 1. Hacer más robusto el arranque de voz

Actualizar `src/components/MariaVoiceDialog.tsx` para:

- mantener la solicitud de micrófono dentro del gesto del botón
- esperar explícitamente `await conversation.startSession(...)`
- manejar mejor errores de micrófono:
  - permiso denegado
  - micrófono no encontrado
  - micrófono ocupado por otra app
- si falla la conexión WebRTC con error tipo:
  - `RTC path not found`
  - `validate 404`
  - cierre anómalo `1006`
  
  hacer fallback automático a conexión por `signedUrl`/WebSocket

Esto deja a MarIA funcionando incluso si WebRTC no es compatible en el entorno actual.

---

### 2. Ajustar la Edge Function para soportar fallback

Actualizar `supabase/functions/elevenlabs-conversation-token/index.ts` para que pueda devolver:

- `conversation token` para WebRTC
- `signed_url` para WebSocket cuando el frontend la solicite

Opciones de implementación recomendadas:

```text
POST body: { mode: "webrtc" | "websocket" }
```

o devolver ambos en una sola respuesta:

```json
{
  "token": "...",
  "signed_url": "..."
}
```

Así el frontend puede intentar primero la mejor opción y caer a la alternativa sin romper la experiencia.

---

### 3. Eliminar por completo los eventos visibles de ElevenLabs

En `src/components/MariaVoiceDialog.tsx` quitar:

- `lastMessage`
- `JSON.stringify(message)`
- cualquier bloque visual que muestre eventos crudos del SDK

`onMessage` quedará solo para lógica interna si hace falta, no para renderizarlo al usuario.

---

### 4. Quitar el preámbulo técnico

Eliminar el texto actual:

```text
MarIA necesita acceso al micrófono para escucharte. Sus respuestas respetan los permisos...
```

y reemplazarlo por copy simple, humano y corto, por ejemplo:

```text
Toca iniciar y háblale a MarIA.
```

o

```text
Pregúntale por animales, pesos, edades o reproducción.
```

Sin mencionar RLS, permisos internos ni detalles técnicos.

---

### 5. Rediseñar la vista para mostrar solo lo importante

Rediseñar `MariaVoiceDialog` con una experiencia más limpia y clara:

#### Estado 1: inactiva
```text
MarIA
Asistente de voz

[ botón grande Iniciar ]
```

#### Estado 2: escuchando
```text
MarIA te está escuchando
Habla ahora
```

Con:
- halo/pulso dorado suave
- icono de micrófono activo
- etiqueta visual “Escuchando”

#### Estado 3: hablando
```text
MarIA está hablando
```

Con:
- icono/onda de audio
- animación suave diferente a la de escucha
- etiqueta visual “Hablando”

#### Estado 4: conectando
```text
Conectando con MarIA…
```

Con loader simple.

#### Estado 5: error amable
Mensajes claros como:
- “No pudimos usar el micrófono.”
- “No se pudo conectar MarIA. Intenta de nuevo.”
- “Revisa si tu navegador permite usar el micrófono.”

Sin exponer mensajes internos del SDK.

---

## Archivos a actualizar

### `src/components/MariaVoiceDialog.tsx`
- reestructurar el flujo de inicio/parada
- usar estados UI dedicados:
  - `idle`
  - `connecting`
  - `listening`
  - `speaking`
  - `error`
- usar `onModeChange`, `onStatusChange`, `onError` y `conversation.isSpeaking` para derivar la experiencia
- ocultar mensajes/eventos internos
- agregar fallback WebRTC → WebSocket

### `supabase/functions/elevenlabs-conversation-token/index.ts`
- soportar entrega de `signed_url` además de `token`
- mantener validación de usuario autenticado
- conservar mensajes de error seguros y amigables

### `src/components/BottomTabBar.tsx`
- solo ajuste menor si hace falta para que el botón central refleje mejor que abre MarIA
- mantener el acceso actual

---

## Resultado esperado

Después del cambio:

```text
1. El usuario toca el botón central.
2. MarIA abre una vista limpia.
3. El usuario inicia conversación.
4. Si WebRTC falla, la app cae automáticamente a WebSocket.
5. MarIA ya puede escuchar correctamente.
6. La pantalla solo muestra:
   - conectando
   - escuchando
   - hablando
   - error amigable
```

Y el usuario ya no verá:

- eventos JSON de ElevenLabs
- preámbulos técnicos sobre permisos
- mensajes internos del sistema

---

## Detalle técnico importante

La causa más fuerte detectada hoy es esta:

```text
WebRTC validate endpoint devuelve 404
```

Por eso la corrección no debe ser solo visual; también hay que endurecer la conexión con fallback.

La mejora recomendada es:

```text
Intentar WebRTC primero
→ si falla por RTC/404/1006
→ iniciar sesión con signedUrl (WebSocket)
```

Esto resuelve tanto la sensación de “MarIA no me escucha” como la estabilidad real de la conversación.
