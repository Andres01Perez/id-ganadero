import { useState } from "react";
import { RefreshCw } from "lucide-react";

const VersionFooter = () => {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
  const commit = typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "local";
  const [reloading, setReloading] = useState(false);

  const handleClick = () => {
    if (reloading) return;
    setReloading(true);
    // Cache-bust reload: query string forces server fetch
    window.location.href = window.location.pathname + "?v=" + Date.now();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={reloading}
      className="w-full inline-flex items-center justify-center gap-1.5 pt-2 pb-1 text-[10px] text-muted-foreground/70 hover:text-gold active:scale-95 transition-all select-none tracking-wider font-mono-num cursor-pointer disabled:opacity-60"
      aria-label="Recargar aplicación"
    >
      <RefreshCw className={`h-3 w-3 ${reloading ? "animate-spin" : ""}`} />
      <span>
        {reloading ? "Recargando..." : `v${version} · ${commit}`}
      </span>
    </button>
  );
};

export default VersionFooter;
