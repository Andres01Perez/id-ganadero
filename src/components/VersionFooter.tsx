import { useRef, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const LONG_PRESS_MS = 1500;

const VersionFooter = () => {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
  const commit = typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "local";
  const [reloading, setReloading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const hardReload = () => {
    if (reloading) return;
    setReloading(true);
    window.location.href = window.location.pathname + "?v=" + Date.now();
  };

  const clearAllCaches = async () => {
    if (clearing) return;
    setClearing(true);
    longPressFiredRef.current = true;
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      toast.success("Caché limpiado, recargando…");
    } catch {
      toast.error("No se pudo limpiar el caché");
    } finally {
      setTimeout(() => {
        window.location.href = window.location.pathname + "?v=" + Date.now();
      }, 400);
    }
  };

  const startPress = () => {
    longPressFiredRef.current = false;
    longPressTimer.current = window.setTimeout(() => {
      clearAllCaches();
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    // If the long-press already fired the cache clear, skip the normal click.
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    hardReload();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      disabled={reloading || clearing}
      className="w-full inline-flex items-center justify-center gap-1.5 pt-2 pb-1 text-[10px] text-muted-foreground/70 hover:text-gold active:scale-95 transition-all select-none tracking-wider font-mono-num cursor-pointer disabled:opacity-60"
      aria-label="Recargar aplicación. Mantén pulsado para limpiar caché."
    >
      {clearing ? (
        <Trash2 className="h-3 w-3 animate-pulse" />
      ) : (
        <RefreshCw className={`h-3 w-3 ${reloading ? "animate-spin" : ""}`} />
      )}
      <span>
        {clearing
          ? "Limpiando caché..."
          : reloading
            ? "Recargando..."
            : `v${version} · ${commit}`}
      </span>
    </button>
  );
};

export default VersionFooter;
