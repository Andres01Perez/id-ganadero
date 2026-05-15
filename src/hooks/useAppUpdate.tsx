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

    const cleanAndReload = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        // ignore
      }
      window.location.replace(window.location.pathname + "?v=" + Date.now());
    };

    const checkUpdate = async (autoReload: boolean) => {
      if (updateDetectedRef.current) return;
      try {
        const res = await fetch(`/?_v=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const html = await res.text();

        if (!html.includes(currentHash)) {
          updateDetectedRef.current = true;

          if (autoReload) {
            // App vuelve a estar visible y hay versión nueva → recarga limpia, sin pedir nada
            cleanAndReload();
            return;
          }

          // Detección durante sesión activa: toast no descartable
          toast("Nueva versión disponible", {
            description: "Toca Actualizar para aplicar los últimos cambios.",
            duration: Infinity,
            dismissible: false,
            action: {
              label: "Actualizar",
              onClick: cleanAndReload,
            },
          });
        }
      } catch {
        // Sin red o fetch falla: silencioso
      }
    };

    // 1. Chequeo inicial diferido (no bloquea TTI) — toast, no auto
    const initialTimeout = window.setTimeout(() => checkUpdate(false), 3000);

    // 2. Cuando el usuario vuelve a la app → auto-recarga si hay versión nueva
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        checkUpdate(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // 3. Red de seguridad cada 2 horas (toast, no auto, usuario activo)
    const intervalId = window.setInterval(() => checkUpdate(false), 2 * 60 * 60 * 1000);

    return () => {
      window.clearTimeout(initialTimeout);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
