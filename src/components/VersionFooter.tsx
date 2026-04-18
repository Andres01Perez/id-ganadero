import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const hardRefresh = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch (e) {
    console.error("hardRefresh error:", e);
  } finally {
    window.location.reload();
  }
};

const tryUpdate = async (): Promise<"updated" | "uptodate"> => {
  if (!("serviceWorker" in navigator)) return "uptodate";

  const regs = await navigator.serviceWorker.getRegistrations();
  if (regs.length === 0) return "uptodate";

  // Force update check on all registrations
  await Promise.all(
    regs.map((r) =>
      r.update().catch(() => {
        /* ignore network errors */
      })
    )
  );

  // Give the browser a moment to detect a waiting worker
  await wait(1500);

  const fresh = await navigator.serviceWorker.getRegistrations();
  for (const reg of fresh) {
    const waiting = reg.waiting;
    if (waiting) {
      waiting.postMessage({ type: "SKIP_WAITING" });
      // Reload once the new SW takes control
      await wait(500);
      return "updated";
    }
  }
  return "uptodate";
};

const VersionFooter = () => {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
  const commit = typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "local";
  const [checking, setChecking] = useState(false);

  const handleClick = async () => {
    if (checking) return;
    setChecking(true);
    const t = toast.loading("Buscando actualizaciones...");
    try {
      const result = await tryUpdate();
      if (result === "updated") {
        toast.success("Nueva versión encontrada. Actualizando...", { id: t });
        await wait(600);
        await hardRefresh();
        return;
      }
      toast.message("Forzando recarga limpia...", { id: t });
      await wait(400);
      await hardRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Error al actualizar. Recargando...", { id: t });
      await wait(400);
      await hardRefresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={checking}
      className="w-full inline-flex items-center justify-center gap-1.5 pt-2 pb-1 text-[10px] text-muted-foreground/70 hover:text-gold active:scale-95 transition-all select-none tracking-wider font-mono-num cursor-pointer disabled:opacity-60"
      aria-label="Buscar actualizaciones"
    >
      <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
      <span>
        {checking ? "Buscando..." : `v${version} · ${commit}`}
      </span>
    </button>
  );
};

export default VersionFooter;
