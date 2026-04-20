import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Detecta nuevas versiones de la app comparando el hash del bundle JS
 * en runtime contra el index.html del servidor. Sin Service Worker.
 *
 * - Se ejecuta solo en producción (no en preview de Lovable ni dentro de iframe).
 * - Triggers: al montar (3s), visibilitychange→visible, cada 2h.
 * - Una vez detectado el update, se desactivan todos los chequeos.
 */
export function useAppUpdate() {
  const updateDetectedRef = useRef(false);

  useEffect(() => {
    // Guard 1: dentro de iframe (editor de Lovable)
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    // Guard 2: hosts de preview/desarrollo de Lovable
    const host = window.location.hostname;
    const isPreviewHost =
      host.includes("id-preview--") ||
      host.includes("lovableproject.com") ||
      host === "localhost" ||
      host === "127.0.0.1";

    if (isInIframe || isPreviewHost) {
      return;
    }

    // Hash del bundle actual cargado en runtime
    const currentSrc =
      document.querySelector('script[type="module"][src]')?.getAttribute("src") ?? "";
    const currentHash = currentSrc.split("/").pop()?.split("?")[0] ?? "";

    // En dev el src es /src/main.tsx — no es un bundle hasheado, no chequeamos
    if (!currentHash || !currentHash.startsWith("index-") || !currentHash.endsWith(".js")) {
      return;
    }

    const checkUpdate = async () => {
      if (updateDetectedRef.current) return;
      try {
        const res = await fetch(`/?_v=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const html = await res.text();

        if (!html.includes(currentHash)) {
          updateDetectedRef.current = true;
          toast("Nueva versión disponible", {
            description: "Actualiza para aplicar los últimos cambios.",
            duration: Infinity,
            action: {
              label: "Actualizar",
              onClick: () => window.location.reload(),
            },
            cancel: {
              label: "Después",
              onClick: () => {
                /* noop — el flag ya está en true, no volvemos a chequear */
              },
            },
          });
        }
      } catch {
        // Sin red o fetch falla: silencioso
      }
    };

    // 1. Chequeo inicial diferido (no bloquea TTI)
    const initialTimeout = window.setTimeout(checkUpdate, 3000);

    // 2. Cuando el usuario vuelve a la app
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        checkUpdate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // 3. Red de seguridad cada 2 horas
    const intervalId = window.setInterval(checkUpdate, 2 * 60 * 60 * 1000);

    return () => {
      window.clearTimeout(initialTimeout);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
