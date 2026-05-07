import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Bot, Loader2, Mic, PhoneOff, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { agentClientTools, setAgentFincaContext } from "@/lib/agent-tools";
import { useFinca } from "@/contexts/FincaContext";
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

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;

type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "error";
type TokenResponse = { token?: string | null; signed_url?: string | null; error?: string };

const friendlyError = (error: unknown) => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "Permite el uso del micrófono en tu navegador.";
    if (error.name === "NotFoundError") return "No encontramos un micrófono disponible.";
    if (error.name === "NotReadableError") return "El micrófono está ocupado por otra aplicación.";
  }
  return "No se pudo conectar el Agente Ganadero. Intenta de nuevo.";
};

const AgentePanel = ({ open }: { open: boolean }) => {
  const { fincaActiva } = useFinca();
  useEffect(() => {
    setAgentFincaContext(fincaActiva ? { id: fincaActiva.id, nombre: fincaActiva.nombre } : null);
  }, [fincaActiva]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokensRef = useRef<TokenResponse | null>(null);
  const fallbackStartedRef = useRef(false);
  const connectingRef = useRef(false);

  const conversation = useConversation({
    clientTools: agentClientTools,
    onConnect: () => {
      connectingRef.current = false;
      setErrorMessage(null);
      setVoiceState("listening");
    },
    onDisconnect: () => {
      connectingRef.current = false;
      setVoiceState((s) => (s === "error" ? s : "idle"));
    },
    onError: () => {
      connectingRef.current = false;
      void startWebSocketFallback(tokensRef.current?.signed_url);
    },
  });

  const startWebSocketFallback = useCallback(
    async (signedUrl?: string | null) => {
      if (!signedUrl || fallbackStartedRef.current || connectingRef.current) return false;
      fallbackStartedRef.current = true;
      connectingRef.current = true;
      setVoiceState("connecting");
      try {
        await conversation.endSession();
        await conversation.startSession({ signedUrl, connectionType: "websocket" });
        setErrorMessage(null);
        return true;
      } catch (error) {
        setVoiceState("error");
        setErrorMessage(friendlyError(error));
        return false;
      } finally {
        connectingRef.current = false;
      }
    },
    [conversation],
  );

  useEffect(() => {
    if (!open && conversation.status !== "disconnected") {
      void conversation.endSession();
    }
    if (!open) {
      setVoiceState("idle");
      setErrorMessage(null);
      fallbackStartedRef.current = false;
      connectingRef.current = false;
    }
  }, [conversation, open]);

  useEffect(() => {
    if (conversation.status === "connected") {
      setVoiceState(conversation.isSpeaking ? "speaking" : "listening");
    }
  }, [conversation.isSpeaking, conversation.status]);

  const start = useCallback(async () => {
    if (!AGENT_ID) {
      setVoiceState("error");
      setErrorMessage("Falta configurar VITE_ELEVENLABS_AGENT_ID en el proyecto.");
      return;
    }
    setVoiceState("connecting");
    setErrorMessage(null);
    fallbackStartedRef.current = false;
    connectingRef.current = true;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { data, error } = await supabase.functions.invoke<TokenResponse>(
        "elevenlabs-agent-token",
        { body: { agent_id: AGENT_ID } },
      );
      if (error) throw error;
      if (!data?.token && !data?.signed_url) throw new Error(data?.error ?? "missing-token");

      tokensRef.current = data;

      if (data.token) {
        await conversation.startSession({
          conversationToken: data.token,
          connectionType: "webrtc",
        });
        return;
      }
      await startWebSocketFallback(data.signed_url);
    } catch (error) {
      const ok = await startWebSocketFallback(tokensRef.current?.signed_url);
      if (!ok) {
        setVoiceState("error");
        setErrorMessage(friendlyError(error));
      }
    } finally {
      connectingRef.current = false;
    }
  }, [conversation, startWebSocketFallback]);

  const stop = useCallback(async () => {
    await conversation.endSession();
    setVoiceState("idle");
  }, [conversation]);

  const view = useMemo(() => {
    if (voiceState === "connecting")
      return { icon: <Loader2 className="h-9 w-9 animate-spin" />, title: "Conectando…", subtitle: "Un momento", badge: "Conectando" };
    if (voiceState === "speaking")
      return { icon: <Volume2 className="h-9 w-9" />, title: "Agente respondiendo", subtitle: "Escucha la respuesta", badge: "Hablando" };
    if (voiceState === "listening")
      return { icon: <Mic className="h-9 w-9" />, title: "Te está escuchando", subtitle: "Habla ahora", badge: "Escuchando" };
    if (voiceState === "error")
      return { icon: <Mic className="h-9 w-9" />, title: errorMessage ?? "Error de conexión", subtitle: "Intenta de nuevo", badge: "Sin conexión" };
    return { icon: <Bot className="h-9 w-9" />, title: "Agente Ganadero", subtitle: "Asistente de voz de ID Ganadero", badge: "Listo" };
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
          Pregúntale por animales, fincas, pesos o reproducción.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button onClick={start} disabled={isConnecting || conversation.status === "connected"} className="h-12">
          {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          {isConnecting ? "Conectando…" : voiceState === "error" ? "Intentar de nuevo" : "Iniciar"}
        </Button>
        <Button
          variant="outline"
          onClick={stop}
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

const AgenteGanaderoDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md border-border bg-card text-card-foreground sm:rounded-md">
      <DialogHeader>
        <DialogTitle className="text-center text-2xl text-foreground">Agente Ganadero</DialogTitle>
        <DialogDescription className="text-center">
          Tu asistente experto en ganadería.
        </DialogDescription>
      </DialogHeader>
      <ConversationProvider>
        <AgentePanel open={open} />
      </ConversationProvider>
    </DialogContent>
  </Dialog>
);

export default AgenteGanaderoDialog;
