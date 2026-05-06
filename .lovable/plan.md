
## Objetivo

Eliminar por completo la implementación actual de **MarIA** (que no funciona bien y usa secretos manuales en Supabase) y reemplazarla por un nuevo asistente de voz llamado **Agente Ganadero**, conectado mediante el **conector oficial de ElevenLabs en Lovable**.

---

## Fase 1 — Limpieza de MarIA

Se borran los siguientes archivos / referencias:

```text
src/components/MariaVoiceDialog.tsx       (eliminar)
src/lib/maria-tools.ts                    (eliminar — se recreará como agent-tools.ts en fase 3)
supabase/functions/elevenlabs-conversation-token/   (eliminar carpeta + invocar delete_edge_functions)
src/components/BottomTabBar.tsx           (quitar import + botón central de MarIA o sustituirlo)
```

Secretos en Supabase que se eliminarán:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`

(Los borraremos con la herramienta de secretos una vez confirmes; ya no se necesitan porque el conector oficial inyecta sus propias credenciales).

Dependencia npm `@elevenlabs/react`: **se mantiene**, la seguimos necesitando para el nuevo agente.

---

## Fase 2 — Conectar el conector oficial de ElevenLabs

Yo lanzo el flujo `standard_connectors--connect` con `connector_id: elevenlabs`. Tú verás un cuadro de diálogo en Lovable donde:

1. Inicias sesión (o seleccionas) tu cuenta de ElevenLabs.
2. Autorizas la conexión a este proyecto.

Cuando termines, Lovable inyecta automáticamente la variable `ELEVENLABS_API_KEY` (vinculada al conector, no manual) en las Edge Functions. **Nada de pegar API keys a mano.**

---

## Fase 3 — Crear el agente "Agente Ganadero"

ElevenLabs requiere que el agente exista en su plataforma para poder conectarse. Te guiaré así:

### Paso A — Crear el agente en ElevenLabs (lo haces tú, te guío)

1. Entras a [elevenlabs.io/app/agents](https://elevenlabs.io/app/agents) → **Create Agent**.
2. Nombre: `Agente Ganadero`.
3. **Voz** sugerida en español (te dejo elegir): `Mateo`, `Valentina` u otra de tu cuenta.
4. **First message**: "Hola, soy el Agente Ganadero de ID Ganadero. ¿En qué te ayudo hoy?"
5. **System prompt** (te lo entregaré completo, optimizado para ganadería: consultar animales, fincas, pesos, reproducción, sin inventar datos, respuestas cortas en español).
6. **Language**: Spanish.
7. **Client Tools** (las registramos en el panel de ElevenLabs con estos nombres exactos, para que coincidan con el código):
   - `buscar_animales`
   - `contar_animales`
   - `detalle_animal`
   - `consultar_pesajes`
   - `consultar_reproduccion`
   - `resumen_ganaderia`

   Te paso la descripción y el JSON-Schema de parámetros de cada una para copiar/pegar.
8. Copias el **Agent ID** que ElevenLabs te muestra.

### Paso B — Guardar el Agent ID

El Agent ID **no es secreto** (es público en el frontend del SDK). Lo guardaremos como variable pública:

```text
VITE_ELEVENLABS_AGENT_ID=<tu-agent-id>
```

Te indicaré pegarlo en `.env` y lo leeremos con `import.meta.env.VITE_ELEVENLABS_AGENT_ID`.

---

## Fase 4 — Implementar el Agente Ganadero en código

Archivos nuevos:

```text
src/lib/agent-tools.ts                (idéntica lógica de las tools, renombradas para Agente Ganadero)
src/components/AgenteGanaderoDialog.tsx   (reemplazo de MariaVoiceDialog)
supabase/functions/elevenlabs-agent-token/index.ts   (edge function nueva que pide el conversation token a ElevenLabs vía la API key del conector)
```

Cambios:

```text
src/components/BottomTabBar.tsx       (botón central abre AgenteGanaderoDialog)
```

### Detalles técnicos clave

- La edge function `elevenlabs-agent-token` llama a `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=...` usando `Deno.env.get("ELEVENLABS_API_KEY")` (inyectada por el conector). ElevenLabs **no** está en la lista de connector-gateway con OAuth; usa API key directa, así que esto es correcto.
- El cliente usa `useConversation` de `@elevenlabs/react` con `connectionType: "webrtc"` y `conversationToken`.
- Las Client Tools se pasan por `clientTools: agentClientTools` (mismas funciones, ejecutadas en el navegador con la sesión de Supabase del usuario logueado, así respetamos RLS).
- Mantenemos fallback a WebSocket con signed URL si WebRTC falla (igual que ahora).

---

## Fase 5 — QA

- Probar: "¿Cuántas vacas tengo en La Esperanza?" → debe llamar `contar_animales` y responder con dato real.
- Probar: "Dame el detalle del animal 042" → `detalle_animal`.
- Verificar que el botón central del BottomTabBar abre el nuevo diálogo "Agente Ganadero".
- Confirmar que ya no hay referencias a MarIA en el código.

---

## Resumen de orden de ejecución (cuando apruebes)

1. Borro archivos de MarIA y la edge function vieja.
2. Disparo el conector oficial de ElevenLabs (acción tuya: aceptar el popup).
3. Te paso instrucciones + system prompt + JSON-Schemas para crear el agente en elevenlabs.io.
4. Tú me pegas el Agent ID, yo lo guardo en `.env`.
5. Borro los secretos manuales `ELEVENLABS_API_KEY` y `ELEVENLABS_AGENT_ID` de Supabase.
6. Creo edge function nueva + componente `AgenteGanaderoDialog` + tools.
7. Actualizo BottomTabBar.
8. Probamos juntos.

¿Apruebas el plan para arrancar con la Fase 1?
