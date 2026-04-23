import { useCallback, useEffect, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Bot, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { mariaClientTools } from "@/lib/maria-tools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusLabels: Record<string, string> = {
  connected: "Conectada",
  disconnected: "Desconectada",
  connecting: "Conectando",
};

const MariaVoicePanel = ({ open }: { open: boolean }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const conversation = useConversation({
    clientTools: mariaClientTools,
    onConnect: () => {
      setIsConnecting(false);
      toast.success("MarIA está lista para escucharte");
    },
    onDisconnect: () => setIsConnecting(false),
    onError: (error) => {
      setIsConnecting(false);
      const message = error instanceof Error ? error.message : "No se pudo conectar con MarIA";
      toast.error(message);
    },
    onMessage: (message) => {
      const text = JSON.stringify(message);
      setLastMessage(text.length > 180 ? `${text.slice(0, 180)}…` : text);
    },
  });

  useEffect(() => {
    if (!open && conversation.status !== "disconnected") {
      conversation.endSession();
    }
  }, [conversation, open]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        method: "POST",
      });

      if (error) throw error;
      if (!data?.token) throw new Error("No se recibió token de MarIA");

      conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (error) {
      setIsConnecting(false);
      const message = error instanceof Error ? error.message : "Activa el micrófono para hablar con MarIA";
      toast.error(message);
    }
  }, [conversation]);

  const stopConversation = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  const statusText = statusLabels[conversation.status] ?? conversation.status;
  const activityText = conversation.status === "connected"
    ? conversation.isSpeaking
      ? "MarIA está respondiendo"
      : "MarIA está escuchando"
    : "Toca iniciar para hablar";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-sidebar text-primary">
            {conversation.isSpeaking ? <Volume2 className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{activityText}</p>
            <p className="text-xs text-muted-foreground">Consulta animales, pesos y reproducción.</p>
          </div>
        </div>
        <Badge variant={conversation.status === "connected" ? "default" : "secondary"}>{statusText}</Badge>
      </div>

      <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
        MarIA necesita acceso al micrófono para escucharte. Sus respuestas respetan los permisos de tu usuario y las fincas asignadas.
      </div>

      {lastMessage && (
        <div className="max-h-24 overflow-hidden rounded-md border border-border bg-muted/70 p-3 text-xs text-muted-foreground">
          {lastMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          onClick={startConversation}
          disabled={isConnecting || conversation.status === "connected"}
          className="h-11"
        >
          <Mic className="h-4 w-4" />
          {isConnecting ? "Conectando…" : "Iniciar conversación"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={stopConversation}
          disabled={conversation.status === "disconnected"}
          className="h-11"
        >
          {conversation.status === "connected" ? <PhoneOff className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
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
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-primary bg-sidebar text-primary shadow-gold">
            <Bot className="h-7 w-7" />
          </div>
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
