## MarIA: agente de voz con ElevenLabs para consultar la ganadería

### Sí, es posible

Se puede agregar una inteligencia artificial de voz llamada **MarIA** en el botón central del menú inferior, donde hoy está el hierro/logo.

La forma más segura para esta app no es darle acceso libre a “todo Supabase”, sino crear herramientas controladas para que MarIA consulte solo la información permitida por el usuario conectado.

```text
Usuario habla con MarIA
        ↓
ElevenLabs transcribe y conversa
        ↓
MarIA llama herramientas de la app
        ↓
La app consulta Supabase con la sesión del usuario
        ↓
RLS decide qué puede ver:
- super_admin: todo
- admin: todo
- operario: solo sus fincas
```

Esto evita que un operario pueda preguntarle a MarIA por animales de una finca que no tiene asignada.

---

## Arquitectura recomendada

### Opción recomendada: ElevenLabs + Client Tools + RLS de Supabase

Usaremos el SDK de ElevenLabs en React y definiremos herramientas dentro del frontend.

Ventajas:

- Respeta las políticas RLS actuales.
- No expone la clave de Supabase Service Role.
- MarIA solo ve lo mismo que el usuario puede ver en la app.
- Es más seguro que darle acceso directo a toda la base de datos.
- Permite consultas como:
  - “¿Cuántas hembras tengo?”
  - “Busca la vaca número 683/01”
  - “¿Qué edad tiene esta vaca?”
  - “Muéstrame los últimos pesos”
  - “¿Tiene palpaciones?”
  - “¿Cuál fue la última preñez?”
  - “¿Qué animales hay en Villa Paula?”

---

## Qué se necesita de ElevenLabs

### 1. Crear un Agent en ElevenLabs

En ElevenLabs debes crear un **Conversational AI Agent** llamado:

```text
MarIA
```

Configuración sugerida:

```text
Nombre: MarIA
Idioma principal: Español
Personalidad: Experta en ganadería Brahman y manejo reproductivo
Rol: Asistente de voz de la plataforma JPS Ganadería
```

Prompt recomendado para el agente:

```text
Eres MarIA, la asistente experta de JPS Ganadería.

Ayudas a consultar información de animales, fincas, pesos, edades, números, nombres, razas, colores, palpaciones, preñez, partos, inseminaciones y registros productivos.

Responde en español claro, breve y práctico. 
No inventes información. Si no encuentras datos, dilo claramente.
Cuando necesites información de la base de datos, usa las herramientas disponibles.
```

---

### 2. API Key de ElevenLabs

Sí necesitas crear una API Key en ElevenLabs.

La clave debe permitir usar **Conversational AI** y generar tokens/sesiones para el agente.

No necesita permisos administrativos sobre Supabase.

La app usará la clave solo desde una Supabase Edge Function, nunca desde el navegador.

Se guardará como secreto:

```text
ELEVENLABS_API_KEY
```

También necesitaremos el ID del agente:

```text
ELEVENLABS_AGENT_ID
```

El endpoint que se usará desde backend será:

```text
GET https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=AGENT_ID
Header: xi-api-key: ELEVENLABS_API_KEY
```

Esto permite iniciar una conversación privada con MarIA sin exponer la clave.

---

## Sobre MCP

### ¿Se puede tipo MCP?

Sí, se puede hacer un MCP para que un agente consulte Supabase, pero para este caso no lo recomiendo como primera versión.

El problema de un MCP directo es que puede terminar teniendo demasiado acceso si se conecta con permisos amplios.

Para JPS Ganadería es más seguro empezar con:

```text
ElevenLabs Client Tools + Supabase RLS
```

Luego, si MarIA necesita capacidades más avanzadas, se puede crear un MCP o un conjunto de Edge Functions especializadas, pero siempre con permisos limitados y no con acceso libre a toda la base.

---

## Cambios que implementaría

### 1. Menú inferior

Actualizar `src/components/BottomTabBar.tsx`.

El botón central del hierro pasará a abrir MarIA en vez de navegar al menú.

---

### 2. Nuevo componente de voz

Crear un componente:

```text
src/components/MariaVoiceDialog.tsx
```

Este abrirá una ventana simple con:

```text
MarIA
Tu asistente experta en ganadería

[Iniciar conversación]
[Terminar]
Estado: escuchando / hablando / desconectada
```

También mostrará un mensaje antes de pedir micrófono:

```text
MarIA necesita acceso al micrófono para escucharte.
```

---

### 3. Instalar ElevenLabs React SDK

Agregar dependencia:

```text
@elevenlabs/react
```

Usar `useConversation` para manejar:

- conexión WebRTC
- micrófono
- estado de la conversación
- mensajes de error
- herramientas de consulta

---

### 4. Edge Function para token privado

Crear una Supabase Edge Function:

```text
supabase/functions/elevenlabs-conversation-token/index.ts
```

Responsabilidades:

1. Validar que el usuario esté autenticado.
2. Leer `ELEVENLABS_API_KEY`.
3. Leer `ELEVENLABS_AGENT_ID`.
4. Solicitar token de conversación a ElevenLabs.
5. Devolver el token al frontend.

Así la clave API nunca queda visible.

---

### 5. Herramientas iniciales para MarIA

Definir herramientas que MarIA pueda llamar desde ElevenLabs.

Primera versión recomendada:

```text
buscar_animales
```

Busca animales por número, nombre, tipo, finca, raza o color.

```text
detalle_animal
```

Trae la ficha básica de un animal:

- número
- nombre
- tipo
- sexo
- finca
- raza
- color
- fecha de nacimiento
- edad aproximada
- padre
- madre

```text
consultar_pesajes
```

Trae últimos pesos y fechas.

```text
consultar_reproduccion
```

Consulta:

- palpaciones
- inseminaciones
- partos
- embriones relacionados
- estado reproductivo disponible

```text
resumen_ganaderia
```

Da resumen general permitido para el usuario:

- total de animales visibles
- hembras
- machos
- crías
- embriones
- animales por finca visible

Todas estas consultas usarán el cliente Supabase del usuario conectado, por lo que RLS seguirá aplicando.

---

### 6. Configurar herramientas en ElevenLabs

En el dashboard de ElevenLabs habrá que registrar herramientas con los mismos nombres que tendrá el frontend.

Ejemplo:

```text
buscar_animales
detalle_animal
consultar_pesajes
consultar_reproduccion
resumen_ganaderia
```

Estas herramientas serán “Client Tools”, es decir, ElevenLabs le pedirá a la app que ejecute la consulta y devuelva la respuesta.

---

## Seguridad

### MarIA no tendrá acceso libre a toda la base

La regla será:

```text
MarIA ve lo mismo que ve el usuario conectado.
```

Por ejemplo:

```text
super_admin → MarIA puede responder sobre todo
admin       → MarIA puede responder sobre todo
operario    → MarIA solo puede responder sobre animales de sus fincas
```

No se usará `SUPABASE_SERVICE_ROLE_KEY` para consultas de MarIA en la primera versión.

---

## Resultado esperado

Después de implementarlo:

1. El usuario toca el botón central del menú inferior.
2. Se abre MarIA.
3. La app pide permiso de micrófono.
4. El usuario pregunta por voz:
  ```text
   MarIA, busca la vaca 683/01
  ```
5. MarIA consulta Supabase respetando permisos.
6. MarIA responde por voz:
  ```text
   Encontré la hembra número 683/01. Está en Villa Paula...
  ```

---

## Plan de implementación

### Paso 1: Preparar integración ElevenLabs

- Agregar `@elevenlabs/react`.
- Crear Edge Function para generar token privado.
- Usar secretos `ELEVENLABS_API_KEY` y `ELEVENLABS_AGENT_ID`.

### Paso 2: Crear interfaz MarIA

- Crear `MariaVoiceDialog`.
- Integrarlo en el botón central de `BottomTabBar`.
- Mantener diseño negro/dorado y simple.

### Paso 3: Crear herramientas de consulta

- Implementar herramientas con Supabase client:
  - `buscar_animales`
  - `detalle_animal`
  - `consultar_pesajes`
  - `consultar_reproduccion`
  - `resumen_ganaderia`

### Paso 4: Configurar instrucciones para ElevenLabs

- Definir prompt de MarIA.
- Registrar los Client Tools en ElevenLabs.
- Conectar cada tool con el nombre exacto usado en React.

### Paso 5: Pruebas

Probar con:

```text
super_admin
admin
operario Villa Paula
```

Verificar preguntas como:

```text
¿Cuántas hembras hay?
Busca la vaca 683/01
¿Qué edad tiene?
¿Cuáles fueron sus últimos pesos?
¿Tiene palpaciones?
¿Qué animales hay en Villa Paula?
```

Confirmar que el operario no pueda consultar animales fuera de su finca.