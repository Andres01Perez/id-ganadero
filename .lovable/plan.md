## Plan: Forzar voz en español desde el código

### Cambio único

**`src/components/AgenteGanaderoDialog.tsx`** — Agregar `overrides` al hook `useConversation`:

```ts
const conversation = useConversation({
  clientTools: agentClientTools,
  overrides: {
    agent: {
      language: "es",
    },
    tts: {
      voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah (multilingüe, suena bien en español)
    },
  },
  onConnect: () => { ... },
  // ... resto igual
});
```

### Requisito en ElevenLabs Dashboard (TÚ debes hacerlo)

Para que los `overrides` sean aceptados por ElevenLabs, debes habilitarlos en el agente:

1. Entra a tu agente: `agent_3201kqxrn9svebtv55xr2x5cw25p`
2. Ve a **Security** (o **Advanced → Security**)
3. Activa estos overrides:
   - ✅ **Enable language override**
   - ✅ **Enable voice ID override**
4. En **Voice → Model**, asegúrate de usar `eleven_multilingual_v2` o `eleven_turbo_v2_5` (sí soportan español)
5. Guarda

Si no activas estos toggles, ElevenLabs ignorará los overrides silenciosamente y volverás a escuchar la voz por defecto en inglés.

### Voces alternativas en español

Si Sarah (`EXAVITQu4vr4xnSDxMaL`) no te gusta, puedes cambiar el `voiceId` por:
- **Matilda** — `XrExE9yKIg1WjnnlVkGX` (femenina, cálida)
- **George** — `JBFqnCBsd6RMkjVDRZzb` (masculina, madura)
- **Liam** — `TX3LPaxmHKxFdv7VOQHJ` (masculina, joven)
- O cualquier voz de la [Voice Library](https://elevenlabs.io/voice-library) filtrando por español — pásame el ID y lo dejo configurado.

### QA

1. Recargar el preview
2. Abrir el Agente Ganadero
3. Verificar que responde en español con voz femenina (Sarah)
4. Si sigue en inglés → revisar que los toggles de Security estén activos en ElevenLabs

¿Apruebas este plan?
