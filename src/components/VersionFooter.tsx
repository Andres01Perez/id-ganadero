import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

const VersionFooter = () => {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
  const buildId = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "dev";
  const [working, setWorking] = useState(false);

  const handleClick = async () => {
    if (working) return;
    setWorking(true);
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
      toast.error("No se pudo limpiar el caché, recargando…");
    } finally {
      setTimeout(() => {
        window.location.replace(window.location.pathname + "?v=" + Date.now());
      }, 300);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={working}
      className="w-full inline-flex items-center justify-center gap-1.5 pt-2 pb-1 text-[10px] text-muted-foreground/70 hover:text-gold active:scale-95 transition-all select-none tracking-wider font-mono-num cursor-pointer disabled:opacity-60"
      aria-label="Actualizar a la última versión"
    >
      <RefreshCw className={`h-3 w-3 ${working ? "animate-spin" : ""}`} />
      <span>{working ? "Actualizando…" : `v${version} · ${buildId}`}</span>
    </button>
  );
};

export default VersionFooter;
