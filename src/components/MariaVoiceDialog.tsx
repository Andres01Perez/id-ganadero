import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Bot, Loader2, Mic, PhoneOff, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mariaClientTools } from "@/lib/maria-tools";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "error";

type TokenResponse = {
  token?: string | null;
  signed_url?: string | null;
};

const MARIA_SYSTEM_PROMPT = `Eres MarIA, asistente de voz de JPS Ganadería.
Reglas obligatorias:
- Nunca pidas permiso para consultar la base de datos; consulta directamente con tus herramientas.
- Si preguntan por animales, fincas, pesos, edades, preñez, palpaciones, reproducción, conteos, totales o cantidades, usa una herramienta antes de responder.
- Para preguntas con "cuántos", "cuántas", "total", "cantidad", "hembras", "machos" o nombres de fincas, usa contar_animales o resumen_ganaderia.
- No inventes números, no estimes y no redondees. Responde solo con el dato devuelto por la herramienta.
- Si la herramienta no encuentra datos, dilo claramente.
- Responde corto, claro y en español.`;

const LOW_LATENCY_SESSION = {
  connectionDelay: { default: 0, android: 0, ios: 0 },
  overrides: {
    agent: {
      prompt: { prompt: MARIA_SYSTEM_PROMPT },
      firstMessage: "Hola, soy MarIA. ¿Qué necesitas consultar?",
      language: "es" as const,
    },
  },
};

const getFriendlyError = (error: unknown) => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "Revisa si tu navegador permite usar el micrófono.";
    if (error.name === "NotFoundError") return "No encontramos un micrófono disponible.";
    if (error.name === "NotReadableError") return "El micrófono está ocupado por otra aplicación.";
  }

  return "No se pudo conectar MarIA. Intenta de nuevo.";
};

const MariaVoicePanel = ({ open }: { open: boolean }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenResponse | null>(null);
  const [shouldFallback, setShouldFallback] = useState(false);
  const fallbackStartedRef = useRef(false);
  const connectingRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);

  const conversation = useConversation({
    clientTools: mariaClientTools,
    ...LOW_LATENCY_SESSION,
    onConnect: () => {
      connectingRef.current = false;
      setErrorMessage(null);
      setVoiceState("listening");
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    },
    onDisconnect: () => {
      connectingRef.current = false;
      setVoiceState((current) => (current === "error" ? current : "idle"));
    },
    onError: () => {
      connectingRef.current = false;
      setShouldFallback(true);
    },
  });

  const startWebSocketFallback = useCallback(async (signedUrl?: string | null) => {
    if (!signedUrl || fallbackStartedRef.current || connectingRef.current) return false;

    fallbackStartedRef.current = true;
    connectingRef.current = true;
    setVoiceState("connecting");

    try {
      await conversation.endSession();
      await conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        ...LOW_LATENCY_SESSION,
      });
      setErrorMessage(null);
      return true;
    } catch (error) {
      setVoiceState("error");
      setErrorMessage(getFriendlyError(error));
      return false;
    } finally {
      connectingRef.current = false;
      setShouldFallback(false);
    }
  }, [conversation]);

  useEffect(() => {
    if (!open && conversation.status !== "disconnected") {
      conversation.endSession();
    }
  }, [conversation, open]);

  useEffect(() => {
    if (!open) {
      setVoiceState("idle");
      setErrorMessage(null);
      fallbackStartedRef.current = false;
      connectingRef.current = false;
      setShouldFallback(false);
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (conversation.status === "connected") {
      setVoiceState(conversation.isSpeaking ? "speaking" : "listening");
    }
  }, [conversation.isSpeaking, conversation.status]);

  useEffect(() => {
    if (!shouldFallback) return;

    startWebSocketFallback(tokens?.signed_url).then((started) => {
      if (!started) {
        setVoiceState("error");
        setErrorMessage("No se pudo conectar MarIA. Intenta de nuevo.");
        setShouldFallback(false);
      }
    });
  }, [shouldFallback, startWebSocketFallback, tokens?.signed_url]);

  const startConversation = useCallback(async () => {
    setVoiceState("connecting");
    setErrorMessage(null);
    fallbackStartedRef.current = false;
    connectingRef.current = true;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke<TokenResponse>("elevenlabs-conversation-token", {
        method: "POST",
      });

      if (error) throw error;
      if (!data?.token && !data?.signed_url) throw new Error("missing-token");

      setTokens(data);

      if (data.token) {
        fallbackTimerRef.current = window.setTimeout(() => {
          if (conversation.status !== "connected") {
            startWebSocketFallback(data.signed_url);
          }
        }, 3000);

        await conversation.startSession({
          conversationToken: data.token,
          connectionType: "webrtc",
          ...LOW_LATENCY_SESSION,
        });
        return;
      }

      await startWebSocketFallback(data.signed_url);
    } catch (error) {
      const fallbackStarted = await startWebSocketFallback(tokens?.signed_url);
      if (!fallbackStarted) {
        setVoiceState("error");
        setErrorMessage(getFriendlyError(error));
      }
    } finally {
      connectingRef.current = false;
    }
  }, [conversation, startWebSocketFallback, tokens?.signed_url]);

  const stopConversation = useCallback(async () => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    await conversation.endSession();
    setVoiceState("idle");
  }, [conversation]);

  const view = useMemo(() => {
    if (voiceState === "connecting") {
      return {
        icon: <Loader2 className="h-9 w-9 animate-spin" />,
        title: "Conectando con MarIA…",
        subtitle: "Un momento",
        badge: "Conectando",
      };
    }

    if (voiceState === "speaking") {
      return {
        icon: <Volume2 className="h-9 w-9" />,
        title: "MarIA está hablando",
        subtitle: "Escucha su respuesta",
        badge: "Hablando",
      };
    }

    if (voiceState === "listening") {
      return {
        icon: <Mic className="h-9 w-9" />,
        title: "MarIA te está escuchando",
        subtitle: "Habla ahora",
        badge: "Escuchando",
      };
    }

    if (voiceState === "error") {
      return {
        icon: <Mic className="h-9 w-9" />,
        title: errorMessage ?? "No se pudo conectar MarIA.",
        subtitle: "Intenta de nuevo",
        badge: "Sin conexión",
      };
    }

    return {
      icon: <Bot className="h-9 w-9" />,
      title: "MarIA",
      subtitle: "Asistente de voz",
      badge: "Lista",
    };
  }, [errorMessage, voiceState]);

  const isActive = voiceState === "listening" || voiceState === "speaking";
  const isConnecting = voiceState === "connecting";

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "relative mb-5 flex h-28 w-28 items-center justify-center rounded-full border border-primary bg-sidebar text-primary shadow-gold",
            voiceState === "listening" && "after:absolute after:inset-0 after:rounded-full after:border after:border-primary after:animate-ping",
            voiceState === "speaking" && "before:absolute before:-inset-2 before:rounded-full before:border before:border-primary/60 before:animate-pulse",
          )}
        >
          {view.icon}
        </div>

        <Badge variant={isActive ? "default" : "secondary"} className="mb-3">
          {view.badge}
        </Badge>
        <h3 className="text-2xl font-semibold text-foreground">{view.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{view.subtitle}</p>
      </div>

      {voiceState === "idle" && (
        <p className="text-center text-sm text-muted-foreground">
          Pregúntale por animales, pesos, edades o reproducción.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          onClick={startConversation}
          disabled={isConnecting || conversation.status === "connected"}
          className="h-12"
        >
          {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          {isConnecting ? "Conectando…" : voiceState === "error" ? "Intentar de nuevo" : "Iniciar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={stopConversation}
          disabled={conversation.status === "disconnected" && !isConnecting}
          className="h-12"
        >
          <PhoneOff className="h-4 w-4" />
          Terminar
        </Button>
      </div>
    </div>
  );
};

const MariaVoiceDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card text-card-foreground sm:rounded-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl text-foreground">MarIA</DialogTitle>
          <DialogDescription className="text-center">
            Tu asistente experta en ganadería.
          </DialogDescription>
        </DialogHeader>
        <ConversationProvider>
          <MariaVoicePanel open={open} />
        </ConversationProvider>
      </DialogContent>
    </Dialog>
  );
};

export default MariaVoiceDialog;
