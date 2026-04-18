import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Poll the SW for updates every 60s while app is open
const UPDATE_INTERVAL_MS = 60 * 1000;

const PwaUpdatePrompt = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(swUrl, registration) {
        if (!registration) return;
        // Periodic check for updates
        setInterval(() => {
          registration.update().catch(() => {
            /* network error, ignore */
          });
        }, UPDATE_INTERVAL_MS);
      },
    });
    updateRef.current = updateSW;
  }, []);

  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "";

  return (
    <AlertDialog open={needRefresh} onOpenChange={setNeedRefresh}>
      <AlertDialogContent className="bg-[#0a0a0a] border-2 border-[#b79f60]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#b79f60]">
            Nueva versión disponible
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/80">
            Hay una actualización lista{version ? ` (v${version})` : ""}. Actualiza
            para ver los últimos cambios.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-white/30 text-white hover:bg-white/10">
            Después
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => updateRef.current?.(true)}
            className="bg-[#b79f60] text-[#0a0a0a] font-bold hover:bg-[#a08a4f]"
          >
            Actualizar ahora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PwaUpdatePrompt;
